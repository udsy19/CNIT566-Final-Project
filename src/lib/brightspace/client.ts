// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import type {
  BrightspacePagedResult,
  BrightspaceEnrollment,
  BrightspaceContentModule,
  BrightspaceContentTopic,
  BrightspaceDropboxFolder,
  BrightspaceQuiz,
  BrightspaceGradeValue,
  BrightspaceFinalGrade,
  BrightspaceNewsItem,
  BrightspaceWhoAmI,
} from './types';

const BASE_URL = process.env.BRIGHTSPACE_BASE_URL || 'https://purdue.brightspace.com';
const LP_VERSION = '1.40';
const LE_VERSION = '1.74';

export class BrightspaceClient {
  private cookieHeader: string;

  constructor(cookies: Record<string, string> | string) {
    // Accept either a cookie object or a raw Bearer token (backwards compat)
    if (typeof cookies === 'string') {
      try {
        const parsed = JSON.parse(cookies);
        this.cookieHeader = Object.entries(parsed)
          .map(([name, value]) => `${name}=${value}`)
          .join('; ');
      } catch {
        // Legacy: treat as Bearer token
        this.cookieHeader = '';
      }
    } else {
      this.cookieHeader = Object.entries(cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
    }
  }

  private async request<T>(path: string, retries = 3): Promise<T> {
    const url = `${BASE_URL}${path}`;

    for (let attempt = 0; attempt < retries; attempt++) {
      const response = await fetch(url, {
        headers: {
          'Cookie': this.cookieHeader,
          'Content-Type': 'application/json',
        },
        redirect: 'manual',
      });

      // If we get a redirect to login, cookies are expired
      if (response.status === 302 || response.status === 301) {
        const location = response.headers.get('location') || '';
        if (location.includes('login') || location.includes('auth')) {
          throw new Error('Session expired — please re-authenticate with Brightspace');
        }
      }

      if (response.status === 429) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        throw new Error(`Brightspace API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    }

    throw new Error('Max retries exceeded for Brightspace API');
  }

  async whoAmI(): Promise<BrightspaceWhoAmI> {
    return this.request(`/d2l/api/lp/${LP_VERSION}/users/whoami`);
  }

  async getMyEnrollments(): Promise<BrightspaceEnrollment[]> {
    const enrollments: BrightspaceEnrollment[] = [];
    let bookmark = '';

    while (true) {
      const params = bookmark ? `?bookmark=${bookmark}` : '';
      const result = await this.request<BrightspacePagedResult<BrightspaceEnrollment>>(
        `/d2l/api/lp/${LP_VERSION}/enrollments/myenrollments/${params}`
      );

      // Filter to Course Offerings (type 3)
      const courseEnrollments = result.Items.filter(
        (e) => e.OrgUnit.Type.Id === 3
      );
      enrollments.push(...courseEnrollments);

      if (!result.PagingInfo.HasMoreItems) break;
      bookmark = result.PagingInfo.Bookmark;
    }

    return enrollments;
  }

  async getContentRoot(orgUnitId: number): Promise<BrightspaceContentModule[]> {
    return this.request(`/d2l/api/le/${LE_VERSION}/${orgUnitId}/content/root/`);
  }

  async getModuleChildren(orgUnitId: number, moduleId: number): Promise<BrightspaceContentTopic[]> {
    return this.request(`/d2l/api/le/${LE_VERSION}/${orgUnitId}/content/modules/${moduleId}/structure/`);
  }

  async getDropboxFolders(orgUnitId: number): Promise<BrightspaceDropboxFolder[]> {
    return this.request(`/d2l/api/le/${LE_VERSION}/${orgUnitId}/dropbox/folders/`);
  }

  async getQuizzes(orgUnitId: number): Promise<BrightspaceQuiz[]> {
    const result = await this.request<{ Objects: BrightspaceQuiz[] }>(
      `/d2l/api/le/${LE_VERSION}/${orgUnitId}/quizzes/`
    );
    return result.Objects || [];
  }

  async getMyGradeValues(orgUnitId: number): Promise<BrightspaceGradeValue[]> {
    return this.request(`/d2l/api/le/${LE_VERSION}/${orgUnitId}/grades/values/myGradeValues/`);
  }

  async getFinalGrade(orgUnitId: number): Promise<BrightspaceFinalGrade | null> {
    try {
      return await this.request(`/d2l/api/le/${LE_VERSION}/${orgUnitId}/grades/final/values/myGradeValue`);
    } catch {
      return null;
    }
  }

  async getAnnouncements(orgUnitId: number): Promise<BrightspaceNewsItem[]> {
    return this.request(`/d2l/api/le/${LE_VERSION}/${orgUnitId}/news/`);
  }
}
