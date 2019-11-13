'use strict'

const Joi = require('joi')
const { validatorReq, validatorRes } = require('../modules/validator')

exports.checkQueryId = () => (
    validatorReq({
        headers: {},
        query: {
            id: Joi.string().required()
        },
        params: {},
        body: {}
    })
)

exports.checkBodyId = () => (
    validatorReq({
        headers: {},
        query: {},
        params: {},
        body: {
            id: Joi.string().required()
        }
    })
)

exports.checkPost = () => (
    validatorRes({
        body: {
            photo: Joi.object().keys({
                source: Joi.string().required(),
                url: Joi.string().required()
            }),
            lettersCount: Joi.number().required(),
            url: Joi.string().required(),
            position: Joi.number().integer(),
            _id: Joi.object().required(),
            type: Joi.string().required(),
            rubric: Joi.object().required(),
            title: Joi.string().required(),
            countView: Joi.number().integer(),
            lead: Joi.string().required(),
            html: Joi.string().required(),
            author: Joi.string().required(),
            date: Joi.date(),
            created: Joi.date(),
            updated: Joi.date()
        }
    })
)

exports.checkQueryCountPage = () => (
    validatorReq({
        headers: {},
        query: {
            count: Joi.number().integer().required(),
            page: Joi.number().integer().required()
        },
        params: {},
        body: {}
    })
)

exports.checkHeaderToken = () => (
    validatorReq({
        headers: {
            'x-auth-token': Joi.string().required()
        },
        query: {},
        params: {},
        body: {}
    })
)

exports.verifyToken = verifyToken
exports.validatePage = validatePage
