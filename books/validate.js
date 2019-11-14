'use strict'

const Joi = require('joi')
const { validatorReq, validatorRes } = require('../modules/validator')

exports.checkBook = () => (
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