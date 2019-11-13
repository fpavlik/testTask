'use strict'

const joi = require('joi')

/**
 * Helper function to validator an object against the provided schema,
 * and to throw a custom error if object is not valid.
 *
 * @param {object} object The object to be validated.
 * @param {string} label The label to use in the error message.
 * @param {JoiSchema} schema The Joi schema to validator the object against.
 * @param {object} options
 */
function validateObject (object = {}, label, schema, options) {
    // Skip validation if no schema is provided
    if (schema) {
        // Validate the object against the provided schema
        const { error } = joi.validate(object, schema, options)
        if (error) {
            // Throw error with custom message if validation failed
            throw new Error(`Invalid ${label} - ${error.message}`)
        }
    }
}

/**
 * Generate a Koa middleware function to validator a request using
 * the provided validation objects.
 *
 * @param {object} validationObj
 * @param {object} validationObj.headers The request headers schema
 * @param {object} validationObj.params The request params schema
 * @param {object} validationObj.query The request query schema
 * @param {object} validationObj.body The request body schema
 * @returns A validation middleware function.
 */

function validatorReq (validationObj) {
    // Return a Koa middleware function
    return (ctx, next) => {
        try {
            // Validate each request data object in the Koa context object
            validateObject(ctx.headers, 'Headers', validationObj.headers, { allowUnknown: true })
            validateObject(ctx.params, 'URL Parameters', validationObj.params)
            validateObject(ctx.query, 'URL Query', validationObj.query)

            if (ctx.request.body) {
                validateObject(ctx.request.body, 'Request Body', validationObj.body)
            }

            return next()
        } catch (err) {
            ctx.throw(406)
        }
    }
}

function validatorRes (validationObj) {
    return (ctx, next) => {
        try {
            if (ctx.body) {
                validateObject(ctx.body, 'Response Body', validationObj.body)
            }
            return next()
        } catch (err) {
            ctx.throw(511)
        }
    }
}

module.exports = { validatorReq, validatorRes }
