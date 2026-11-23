// API response helpers

export function success(data, status = 200) {
  return Response.json(data, { status });
}

export function created(data) {
  return Response.json(data, { status: 201 });
}

export function error(message, status = 500) {
  return Response.json({ error: message }, { status });
}

export function notFound(message = 'Not found') {
  return Response.json({ error: message }, { status: 404 });
}

export function badRequest(message = 'Bad request') {
  return Response.json({ error: message }, { status: 400 });
}

export function unauthorized(message = 'Unauthorized') {
  return Response.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return Response.json({ error: message }, { status: 403 });
}

// Parse pagination params from URL
export function parsePagination(searchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// Build paginated response
export function paginated(data, total, page, limit) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

// Parse sort params
export function parseSort(searchParams, allowedFields, defaultField = 'created_at', defaultOrder = 'DESC') {
  const sortBy = searchParams.get('sortBy') || defaultField;
  const sortOrder = (searchParams.get('sortOrder') || defaultOrder).toUpperCase();
  
  if (!allowedFields.includes(sortBy)) {
    return { sortBy: defaultField, sortOrder: defaultOrder };
  }
  if (!['ASC', 'DESC'].includes(sortOrder)) {
    return { sortBy, sortOrder: defaultOrder };
  }
  
  return { sortBy, sortOrder };
}

