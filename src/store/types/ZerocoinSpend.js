import Response from '~/mixins/Response'

const spendZerocoinResponse = Response.types('spend zerocoin')

export const IS_LOADING = 'IS_LOADING'

export const SET_FORM_LABEL = 'SET_FORM_LABEL'
export const SET_FORM_MINTS = 'SET_FORM_MINTS'
export const CLEAR_FORM_MINTS = 'CLEAR_FORM_MINTS'
export const SET_FORM_ADDRESS = 'SET_FORM_ADDRESS'
export const CLEAR_FORM = 'CLEAR_FORM'

export const SET_CURRENT_PASSPHRASE = 'SET_CURRENT_PASSPHRASE'

export const CONFIRM_SPEND = 'CONFIRM_SPEND'

export const SPEND_ZEROCOIN = 'SPEND_ZEROCOIN'
/*
export const SET_SPEND_ZEROCOIN_RESPONSE = 'SET_SPEND_ZEROCOIN_RESPONSE'
export const ON_SPEND_ZEROCOIN_SUCCESS = 'ON_SPEND_ZEROCOIN_SUCCESS'
export const ON_SPEND_ZEROCOIN_ERROR = 'ON_SPEND_ZEROCOIN_ERROR'
*/

export default {
    ...spendZerocoinResponse
}