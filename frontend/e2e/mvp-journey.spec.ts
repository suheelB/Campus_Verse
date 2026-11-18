import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import {
  API_BASE,
  expectJson,
  grantCollegeAdmin,
  queryDatabase,
  registerViaApi,
  uniqueSuffix,
} from './support/api'

const password = 'CampusVerse-E2E-2026!'

interface ClubSummary {
  id: string
  name: string
}

interface MembershipSummary {
  id: string
  clubId: string
  status: string
}

interface EventSummary {
  id: string
  title: string
}

function dateTimeLocal(daysFromNow: number, hour: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  date.setHours(hour, 0, 0, 0)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function login(page: Page, email: string, userPassword: string) {
  await page.goto('/login')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(userPassword)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

async function authenticatedContext(browser: BrowserContext['browser'], token: string) {
  const context = await browser!.newContext()
  await context.addInitScript((authToken) => {
    localStorage.setItem('token', authToken)
  }, token)
  return context
}

test.describe.serial('CampusVerse MVP journey', () => {
  test('student joins a club, acknowledges a notice, registers, and is checked in', async ({ browser, request, playwright }) => {
    const suffix = uniqueSuffix()
    const collegeSlug = 'demo-college'

    const officer = await registerViaApi(request, {
      email: `officer-${suffix}@demo.edu`,
      password,
      displayName: `Officer ${suffix}`,
      collegeSlug,
    })
    const admin = await registerViaApi(request, {
      email: `admin-${suffix}@demo.edu`,
      password,
      displayName: `Admin ${suffix}`,
      collegeSlug,
    })
    grantCollegeAdmin(admin.email)

    const studentEmail = `student-${suffix}@demo.edu`
    const studentName = `Student ${suffix}`
    const clubName = `Robotics Society ${suffix}`
    const announcementTitle = `Welcome to ${clubName}`
    const eventTitle = `Robotics Build Night ${suffix}`
    const eventVenue = 'Innovation Lab 2'

    const studentContext = await browser.newContext()
    const officerContext = await browser.newContext()
    const adminContext = await browser.newContext()
    const studentPage = await studentContext.newPage()
    const officerPage = await officerContext.newPage()
    const adminPage = await adminContext.newPage()

    try {
      // 1-3. A student registers and completes their profile through the UI.
      await studentPage.goto('/register')
      await studentPage.getByLabel('Full Name').fill(studentName)
      await studentPage.getByLabel('Email address').fill(studentEmail)
      await studentPage.getByLabel('College').selectOption(collegeSlug)
      await studentPage.getByLabel('Password', { exact: true }).fill(password)
      await studentPage.getByLabel('Confirm Password').fill(password)
      await studentPage.getByRole('button', { name: 'Create account' }).click()
      await expect(studentPage).toHaveURL(/\/dashboard/)

      await studentPage.goto('/profile')
      await studentPage.getByLabel('Program / Major').fill('Computer Science')
      await studentPage.getByLabel('Department').fill('Engineering')
      await studentPage.getByLabel('Academic Year').fill('Year 2')
      await studentPage.getByLabel('Bio').fill('Robotics and community organizing enthusiast.')
      await studentPage.getByRole('radio', { name: /Club Members Only/ }).check()
      await studentPage.getByRole('button', { name: 'Save Changes' }).click()
      await expect(studentPage.getByText('Profile updated successfully!')).toBeVisible()

      const studentLogin = await request.post(`${API_BASE}/auth/login`, {
        data: { email: studentEmail, password },
      })
      const studentBody = await expectJson(studentLogin, 200, 'student login')
      const studentToken = studentBody.data.token as string
      const studentId = studentBody.data.user.id as string

      // 4. An officer requests a club and the administrator approves it.
      await login(officerPage, officer.email, password)
      await officerPage.goto('/clubs')
      await officerPage.getByRole('button', { name: 'Request a club' }).click()
      const clubRequestForm = officerPage.locator('section[aria-labelledby="club-request-title"]')
      await clubRequestForm.getByLabel('Club name').fill(clubName)
      await clubRequestForm.getByLabel('Category').selectOption({ label: 'Technology & Innovation' })
      await clubRequestForm.getByLabel('What is this club about?').fill('Student robotics, embedded systems, and competition teams.')
      await clubRequestForm.getByLabel('Contact email (optional)').fill(officer.email)
      await clubRequestForm.getByRole('button', { name: 'Send for approval' }).click()
      await expect(officerPage.getByText(`“${clubName}” was sent for college approval.`)).toBeVisible()

      const officerApi = await playwright.request.newContext({
        baseURL: API_BASE,
        extraHTTPHeaders: { Authorization: `Bearer ${officer.token}` },
      })
      const officerClubs = await expectJson(await officerApi.get(`${API_BASE}/clubs/mine`), 200, 'officer club requests')
      const club = (officerClubs as ClubSummary[]).find((item) => item.name === clubName)
      expect(club, 'club request must be persisted').toBeTruthy()
      const clubId = club.id as string

      await login(adminPage, admin.email, password)
      await adminPage.goto('/clubs/manage')
      const clubRequest = adminPage.locator('article').filter({ hasText: clubName })
      await expect(clubRequest).toBeVisible()
      await clubRequest.getByRole('button', { name: 'Approve', exact: true }).click()
      await expect(clubRequest).toHaveCount(0)

      // 5-6. The student discovers the club and applies.
      await studentPage.goto('/clubs')
      await studentPage.getByLabel('Search clubs').fill(clubName)
      const clubCard = studentPage.locator('article').filter({ hasText: clubName }).first()
      await expect(clubCard).toBeVisible()
      await clubCard.getByRole('link', { name: /View club/ }).click()
      await studentPage.getByRole('button', { name: 'Apply to join' }).click()
      await expect(studentPage.getByText('Your membership application was submitted.')).toBeVisible()

      const studentApi = await playwright.request.newContext({
        baseURL: API_BASE,
        extraHTTPHeaders: { Authorization: `Bearer ${studentToken}` },
      })
      const pendingMemberships = await expectJson(await studentApi.get(`${API_BASE}/memberships/me`), 200, 'student memberships')
      const pendingMembership = (pendingMemberships as MembershipSummary[]).find((item) => item.clubId === clubId)
      expect(pendingMembership?.status).toBe('PENDING')
      const membershipId = pendingMembership.id as string

      // 7. The officer approves the application.
      await officerPage.goto('/clubs/manage')
      const applicationRow = officerPage.locator('li').filter({ hasText: studentName }).first()
      await expect(applicationRow).toBeVisible()
      await applicationRow.getByRole('button', { name: 'Approve', exact: true }).click()
      await expect(officerPage.getByText(studentName).first()).toBeVisible()

      // 8. The student sees the active membership.
      await studentPage.reload()
      await studentPage.goto('/my-clubs')
      await expect(studentPage.getByText(clubName).first()).toBeVisible()
      await expect(studentPage.getByText('Member').first()).toBeVisible()

      // 9-10. The officer publishes an announcement requiring acknowledgement.
      await officerPage.goto('/announcements')
      await officerPage.getByRole('button', { name: 'Post announcement' }).click()
      await officerPage.getByLabel('Posting on behalf of').selectOption({ label: `${clubName} (Club)` })
      await officerPage.getByLabel('Title').fill(announcementTitle)
      await officerPage.getByLabel('Priority').selectOption('IMPORTANT')
      await officerPage.getByLabel('Target audience').selectOption('CLUB_MEMBERS')
      await officerPage.getByLabel('Announcement details').fill('Please read the safety briefing before the first build night.')
      await officerPage.getByLabel('Require members to acknowledge reading this announcement').check()
      await officerPage.getByRole('button', { name: 'Publish announcement' }).click()
      await expect(officerPage.getByText('Announcement published successfully.')).toBeVisible()

      // 11. The student sees and acknowledges it.
      await studentPage.goto('/announcements')
      const announcementCard = studentPage.locator('article').filter({ hasText: announcementTitle })
      await expect(announcementCard).toBeVisible()
      await announcementCard.getByRole('button', { name: 'Acknowledge reading' }).click()
      await expect(announcementCard.getByText('Acknowledged', { exact: true })).toBeVisible()

      // 12. The officer submits an event proposal.
      await officerPage.goto('/events')
      await officerPage.getByRole('button', { name: 'Host an Event' }).click()
      await officerPage.getByLabel('Host Club *').selectOption({ label: clubName })
      await officerPage.getByLabel('Event Title *').fill(eventTitle)
      await officerPage.getByLabel('Description *').fill('Hands-on build night for the robotics competition team.')
      await officerPage.getByLabel('Starts At *').fill(dateTimeLocal(3, 18))
      await officerPage.getByLabel('Ends At *').fill(dateTimeLocal(3, 20))
      await officerPage.getByLabel('Venue / Location').fill(eventVenue)
      await officerPage.getByLabel('Capacity Limit').fill('2')
      await officerPage.getByRole('button', { name: 'Submit Event' }).click()
      await expect(officerPage.getByText('Event submitted for college administrator approval.')).toBeVisible()

      const pendingEvents = await expectJson(
        await officerApi.get(`${API_BASE}/events?status=PENDING_APPROVAL&clubId=${clubId}&size=50`),
        200,
        'pending event list',
      )
      const event = (pendingEvents.content as EventSummary[]).find((item) => item.title === eventTitle)
      expect(event, 'event proposal must be persisted').toBeTruthy()
      const eventId = event.id as string

      // Unpublished proposals must not leak to students by id.
      await expectJson(await studentApi.get(`${API_BASE}/events/${eventId}`), 404, 'student reading proposal')

      // 13. The administrator approves the event.
      await adminPage.goto('/clubs/manage')
      const eventProposal = adminPage.locator('article').filter({ hasText: eventTitle })
      await expect(eventProposal).toBeVisible()
      await eventProposal.getByRole('button', { name: 'Approve event' }).click()
      await expect(eventProposal).toHaveCount(0)

      // 14. The student registers.
      await studentPage.goto('/events')
      await studentPage.getByPlaceholder('Search events by title...').fill(eventTitle)
      const eventCard = studentPage.locator('div').filter({ has: studentPage.getByRole('link', { name: eventTitle }) }).first()
      await expect(studentPage.getByRole('link', { name: eventTitle })).toBeVisible()
      await studentPage.getByRole('link', { name: eventTitle }).click()
      await studentPage.getByRole('button', { name: 'Register for Event' }).click()
      await expect(studentPage.getByText('Registration confirmed!')).toBeVisible()
      void eventCard

      // 15. The organizer checks the student in and views the report.
      await officerPage.goto(`/events/${eventId}`)
      await expect(officerPage.getByRole('heading', { name: 'Organizer Control Panel' })).toBeVisible()
      await officerPage.getByRole('button', { name: 'Check In Attendees' }).click()
      const checkInModal = officerPage.locator('.fixed.inset-0').filter({ hasText: 'Event Check-In Desk' })
      await expect(checkInModal).toBeVisible()
      const rosterRow = checkInModal.locator('div.p-3').filter({ hasText: studentName }).first()
      await expect(rosterRow).toBeVisible()
      await rosterRow.getByRole('button', { name: 'Check In' }).click()
      await expect(checkInModal.getByText(`Checked in ${studentName}!`)).toBeVisible()
      await checkInModal.getByRole('button', { name: 'Done' }).click()

      await officerPage.getByRole('button', { name: 'Turnout Report' }).click()
      const reportModal = officerPage.locator('.fixed.inset-0').filter({ hasText: 'Attendance & Turnout Report' })
      await expect(reportModal).toBeVisible()
      await expect(reportModal.getByText('Attended (Checked In)')).toBeVisible()
      await expect(reportModal.getByText('100%')).toBeVisible()
      await reportModal.getByRole('button', { name: 'Close' }).click()

      const report = await expectJson(
        await officerApi.get(`${API_BASE}/events/${eventId}/attendance/report`),
        200,
        'attendance report',
      )
      expect(report.totalRegistered).toBe(1)
      expect(report.totalAttended).toBe(1)
      expect(report.attendanceRatePercent).toBe(100)

      // 16. The student sees the attendance state.
      await studentPage.goto(`/events/${eventId}`)
      await expect(studentPage.getByText('Your attendance has been recorded for this event.')).toBeVisible()

      // Security boundaries.
      await expectJson(
        await studentApi.post(`${API_BASE}/announcements`, {
          data: {
            clubId,
            title: 'Unauthorized notice',
            body: 'This must be rejected.',
            priority: 'NORMAL',
            audienceType: 'CLUB_MEMBERS',
          },
        }),
        403,
        'student announcement creation',
      )
      await expectJson(await studentApi.get(`${API_BASE}/events/${eventId}/registrations`), 403, 'student roster access')
      await expectJson(
        await studentApi.post(`${API_BASE}/memberships/${membershipId}/approve`),
        403,
        'student self-approval',
      )
      await expectJson(await studentApi.post(`${API_BASE}/events/${eventId}/approve`), 403, 'student event approval')

      const unauthenticated = await playwright.request.newContext({ baseURL: API_BASE })
      await expectJson(await unauthenticated.get(`${API_BASE}/auth/me`), 401, 'unauthenticated current user')

      const outsider = await registerViaApi(request, {
        email: `outsider-${suffix}@state.edu`,
        password,
        displayName: `Outsider ${suffix}`,
        collegeSlug: 'state-university',
      })
      const outsiderApi = await playwright.request.newContext({
        baseURL: API_BASE,
        extraHTTPHeaders: { Authorization: `Bearer ${outsider.token}` },
      })
      await expectJson(await outsiderApi.get(`${API_BASE}/clubs/${clubId}`), 404, 'cross-college club detail')
      await expectJson(await outsiderApi.post(`${API_BASE}/memberships/clubs/${clubId}`), 404, 'cross-college application')

      // 17. Verify persisted database records, not just the API responses.
      const persisted = queryDatabase(
        `SELECT
           (SELECT m.status FROM memberships m
              JOIN users u ON u.id = m.user_id
              JOIN clubs c ON c.id = m.club_id
             WHERE u.email = :'email' AND c.id = :'clubId') AS membership_status,
           (SELECT r.status FROM event_registrations r
              JOIN users u ON u.id = r.user_id
             WHERE u.email = :'email' AND r.event_id = :'eventId') AS registration_status,
           (SELECT COUNT(*) FROM event_attendance a
              JOIN users u ON u.id = a.user_id
             WHERE u.email = :'email' AND a.event_id = :'eventId') AS attendance_count,
           (SELECT COUNT(*) FROM announcement_receipts ar
              JOIN users u ON u.id = ar.user_id
              JOIN announcements a ON a.id = ar.announcement_id
             WHERE u.email = :'email' AND a.title = :'announcementTitle'
               AND ar.acknowledged_at IS NOT NULL) AS acknowledgement_count,
           (SELECT COUNT(*) FROM notifications n
              JOIN users u ON u.id = n.user_id
             WHERE u.email = :'email' AND n.type = 'ANNOUNCEMENT'
               AND n.title = :'announcementTitle') AS announcement_notification_count`,
        {
          email: studentEmail,
          clubId,
          eventId,
          announcementTitle,
        },
      )
      expect(persisted.split('|')).toEqual(['ACTIVE', 'ATTENDED', '1', '1', '1'])
      void studentId
      void officerPage
      void authenticatedContext
    } finally {
      await studentContext.close()
      await officerContext.close()
      await adminContext.close()
    }
  })
})
