class ApiResponse {
  constructor(statusCode, message = "Sucess", data) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}
export default ApiResponse;
