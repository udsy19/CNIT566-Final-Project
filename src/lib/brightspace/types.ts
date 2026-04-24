// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// Brightspace API types
export interface BrightspacePagingInfo {
  Bookmark: string;
  HasMoreItems: boolean;
}

export interface BrightspacePagedResult<T> {
  PagingInfo: BrightspacePagingInfo;
  Items: T[];
}

export interface BrightspaceEnrollment {
  OrgUnit: {
    Id: number;
    Type: { Id: number; Code: string; Name: string };
    Name: string;
    Code: string;
    HomeUrl: string;
    ImageUrl: string | null;
  };
  Access: {
    IsActive: boolean;
    StartDate: string | null;
    EndDate: string | null;
    CanAccess: boolean;
    ClasslistRoleName: string;
    LISRoles: string[];
  };
}

export interface BrightspaceContentModule {
  Id: number;
  Title: string;
  ShortTitle: string;
  Type: number;
  Description: { Text: string; Html: string } | null;
  ParentModuleId: number | null;
  Structure: BrightspaceContentModule[];
}

export interface BrightspaceContentTopic {
  TopicId: number;
  Identifier: string;
  TypeIdentifier: string;
  Title: string;
  ShortTitle: string;
  Url: string;
  StartDate: string | null;
  EndDate: string | null;
  DueDate: string | null;
  IsHidden: boolean;
  IsLocked: boolean;
  Description: { Text: string; Html: string } | null;
}

export interface BrightspaceDropboxFolder {
  Id: number;
  CategoryId: number | null;
  Name: string;
  Instructions: { Text: string; Html: string } | null;
  DueDate: string | null;
  EndDate: string | null;
  Assessment: {
    ScoreDenominator: number | null;
    Weight: number | null;
  } | null;
}

export interface BrightspaceQuiz {
  QuizId: number;
  Name: string;
  Description: { Text: string; Html: string } | null;
  StartDate: string | null;
  EndDate: string | null;
  DueDate: string | null;
  GradeItemId: number | null;
  IsActive: boolean;
  SortOrder: number;
  AutoExportToGrades: boolean;
}

export interface BrightspaceGradeItem {
  Id: number;
  Name: string;
  ShortName: string;
  GradeType: string;
  CategoryId: number | null;
  MaxPoints: number;
  Weight: number | null;
}

export interface BrightspaceGradeValue {
  GradeObjectIdentifier: number;
  GradeObjectName: string;
  GradeObjectType: number;
  GradeObjectTypeName: string;
  DisplayedGrade: string;
  PointsNumerator: number | null;
  PointsDenominator: number | null;
  WeightedNumerator: number | null;
  WeightedDenominator: number | null;
}

export interface BrightspaceFinalGrade {
  DisplayedGrade: string;
  GradeValue: number | null;
  PointsNumerator: number | null;
  PointsDenominator: number | null;
}

export interface BrightspaceNewsItem {
  Id: number;
  Title: string;
  Body: { Text: string; Html: string } | null;
  StartDate: string;
  EndDate: string | null;
  IsGlobal: boolean;
  IsPublished: boolean;
  CreatedDate: string;
}

export interface BrightspaceTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface BrightspaceWhoAmI {
  Identifier: string;
  FirstName: string;
  LastName: string;
  UniqueName: string;
  ProfileIdentifier: string;
}
