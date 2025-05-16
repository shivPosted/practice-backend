class ApiError extends Error {
  constructor(
    message = "Something went wrong",
    statusCode,
    stack,
    errors = [],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.data = null;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
