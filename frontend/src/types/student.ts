/*
 * Copyright 2024 CampusVerse Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface StudentProfileDto {
  program: string | null
  department: string | null
  academicYear: string | null
  bio: string | null
  profileVisibility: 'PUBLIC' | 'CLUB_MEMBERS' | 'PRIVATE'
}

export interface UpdateStudentProfileRequest {
  program?: string
  department?: string
  academicYear?: string
  bio?: string
  profileVisibility?: 'PUBLIC' | 'CLUB_MEMBERS' | 'PRIVATE'
}