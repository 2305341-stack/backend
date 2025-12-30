const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
      }
}


export {asyncHandler}

/*
const asyncHandler = () => {}
const asyncHandler = (func) => {() => {}}
const asyncHandler = (func) => async () =>  {}
*/


// we have just removed the curly brace
//this is try catch wrapper function, we can also have promises wrapper function


/*
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
    }
}
*/