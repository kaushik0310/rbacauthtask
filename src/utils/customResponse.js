"use strict";
//Helper function to generate custom response
const createResponse = (res, { success, message, data }, statusCode) => {
    return res.status(statusCode).json({
        success,
        message: message || (success ? "Action completed" : "Failed to process request"),
        data: data
    });
}

module.exports = {

    //response on the api success
    success: (res, { success,message, data }, statusCode ) => {
        return createResponse(res,
            {
                success:success|| true,
                message,
                data
            },statusCode= statusCode || 200);
    },
    //response on the api failed or any error
    error: (res, {success, message, data }, statusCode) => {
        return createResponse(res,
            {   
                success: success||false,
                message, data
            }, statusCode = statusCode || 500);
    },
    //response on unauthorized api
    unAuthorized: (res, { message, data }, statusCode = 401) => {
        return createResponse(res,
            {
                success: false,
                message: message || "You are not authorized to access this route",
                data
            }, statusCode);
    }
}