// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { z } from 'zod/v4';

export const askQuestionSchema = z.object({
  question: z.string().min(1, 'Question is required').max(2000, 'Question too long'),
  stream: z.boolean().optional().default(true),
});

export const courseAskSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  question: z.string().min(1, 'Question is required').max(2000, 'Question too long'),
});

export const brightspaceLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const assignmentAnalysisSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
});

export const summarizeSchema = z.object({
  content: z.string().min(1, 'Content is required').max(50000, 'Content too long'),
  moduleId: z.string().optional(),
});
