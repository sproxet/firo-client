// import types from '../../../store/types'
import mixin from './mixin'

export default {
    ...mixin,
    ...({
        namespace: 'Blockchain',
        subscriptions: ['block']
    })
}