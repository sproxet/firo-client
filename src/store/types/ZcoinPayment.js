import IsLoading from 'store/mixins/IsLoading'
import Payment from 'store/mixins/Payments'
import Response from 'store/mixins/Response'

const isLoading = IsLoading.module('')
const pendingPayment = Payment.types('firo')
const sendFiroResponse = Response.types('send firo')

// export const SET_INITIAL_STATE = 'SET_INITIAL_STATE'
export const IS_LOADING = 'IS_LOADING'
export const SET_AVAILABLE_FEES = 'SET_AVAILABLE_FEES'

export const SET_FORM_LABEL = 'SET_FORM_LABEL'
export const SET_FORM_AMOUNT = 'SET_FORM_AMOUNT'
export const SET_FORM_ADDRESS = 'SET_FORM_ADDRESS'
export const CLEAR_FORM = 'CLEAR_FORM'

export const ADD_PAYMENT_TO_QUEUE = 'ADD_PAYMENT_TO_QUEUE '
export const REMOVE_PAYMENT_FROM_QUEUE = 'REMOVE_PAYMENT_FROM_QUEUE'

export const CONFIRM_PAYMENT = 'CONFIRM_PAYMENT'
export const SEND_PAYMENT = 'SEND_PAYMENT'
export const SET_FEE = 'SET_FEE'

export const CALC_TX_FEE = 'CALC_TX_FEE'
export const SET_TX_FEE = 'SET_TX_FEE'
export const SEND_ZCOIN = 'SEND_ZCOIN'
export const TOGGLE_CUSTOM_INPUTS_POPUP = 'TOGGLE_CUSTOM_INPUTS_POPUP'
export const UPDATE_CUSTOM_INPUTS = 'UPDATE_CUSTOM_INPUTS'
export const UPDATE_COIN_LOCK = 'UPDATE_COIN_LOCK'
export const ENTERED_SEND_AMOUNT = 'ENTERED_SEND_AMOUNT'
export const UPDATE_SPENDABLE_UTXO = 'UPDATE_SPENDABLE_UTXO'

/*
export const SET_SEND_ZCOIN_RESPONSE = 'SET_SEND_ZCOIN_RESPONSE'
export const ON_SEND_ZCOIN_SUCCESS = 'ON_SEND_ZCOIN_SUCCESS'
export const ON_SEND_ZCOIN_ERROR = 'ON_SEND_ZCOIN_ERROR'
*/

// export mixed in types
export default {
    ...isLoading,
    ...pendingPayment,
    ...sendFiroResponse
}
