import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/local-db';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-auth';

interface EncouragementPost {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  is_liked_by_me?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    const userId = authResult.success && authResult.context ? authResult.context.userId : '';

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);

    const allPosts = db.getEncouragementPosts();
    const pagedPosts = allPosts.slice(offset, offset + limit);

    const result: EncouragementPost[] = pagedPosts.map((post: any) => ({
      id: post.id,
      content: post.content,
      likes_count: post.likes_count || 0,
      created_at: post.created_at,
      is_liked_by_me: false,
    }));

    return createSuccessResponse({ posts: result });
  } catch (error: any) {
    console.error('Error in GET /api/encouragement:', error);
    return createErrorResponse(error.message || 'Failed to get encouragement posts');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return createErrorResponse('Content is required', 400);
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < 1 || trimmedContent.length > 200) {
      return createErrorResponse('Content must be between 1 and 200 characters', 400);
    }

    const post = db.createEncouragementPost({
      user_id: userId,
      content: trimmedContent,
    });

    return createSuccessResponse({
      post: {
        id: post.id,
        content: post.content,
        likes_count: post.likes_count,
        created_at: post.created_at,
      },
    }, 201);
  } catch (error: any) {
    console.error('Error in POST /api/encouragement:', error);
    return createErrorResponse(error.message || 'Failed to post encouragement');
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await authenticateRequest(request);

  if (!authResult.success || !authResult.context) {
    return createErrorResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
  }

  const { userId } = authResult.context;

  try {
    const body = await request.json();
    const { post_id, action } = body;

    if (!post_id) {
      return createErrorResponse('post_id is required', 400);
    }

    if (!action || !['like', 'unlike'].includes(action)) {
      return createErrorResponse('action must be "like" or "unlike"', 400);
    }

    const liked = db.toggleEncouragementLike(userId, post_id);

    if (action === 'like' && !liked) {
      return createErrorResponse('Already liked this post', 409);
    }

    const allPosts = db.getEncouragementPosts();
    const post = allPosts.find((p: any) => p.id === post_id);
    const likesCount = post?.likes_count || 0;

    return createSuccessResponse({ likes_count: likesCount });
  } catch (error: any) {
    console.error('Error in PUT /api/encouragement:', error);
    return createErrorResponse(error.message || 'Failed to update like');
  }
}
