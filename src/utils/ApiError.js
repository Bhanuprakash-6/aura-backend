class ApiError extends Error {
    constructor(statusCose,
        message = "Something went wrong",
        errors = [],
        stack = ""

    ){
        super(message);
        this.statusCode = statusCose;
        this.errors = errors;
        this.data = null;
        this.message = message;

        if(stack){
            this.stack = stack;

        }else{
            Error.captureStackTrace(this, this.constructor);
        }

    }
}

export { ApiError }