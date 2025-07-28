// const asyncHandler = (requestHandler) => {
//     return (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next)).catch
//         ((err) => next(err));
//     }
// }





//const asyncHandler = () => {}



const asyncHandler = (requestHandler) => async(req,res,next) => {
    try{
        await requestHandler(req, res, next);

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}

 export {asyncHandler}