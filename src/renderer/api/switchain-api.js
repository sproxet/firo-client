import Http from 'renderer/utils/Http';
import Utils from 'renderer/utils';
import configs from 'config/api';

class APIWorker {
    API_URI = configs.SWITCHAIN_API_URI;

    buildUrl({ url, params }) {
        const query = [];

        for (let key in params) {
            if (typeof params[key] === 'object') {
                for (let k in params[key]) {
                    query.push(k + '=' + params[key][k]);
                }
            } else {
                query.push(key + '=' + params[key]);
            }
        }

        return `${url}?${query.join('&')}`;
    }

    errorMessage(serverError, response) {
        if (serverError) {
            return serverError.message;
        }

        if (response.error){
            console.log(`${response.error}: ${response.reason}`);
            return response.reason;
        }

        return;
    }

    async getMarketInfo() {
        const url = `${this.API_URI}marketinfo/`;

        const [serverError, response] = await Utils.to(
            Http.get({
                url
            })
        );

        const errorMessage = this.errorMessage(serverError, response);

        if (errorMessage) return { error: errorMessage };

        return { error: null, response };
    }

    async getOffer({ pair, amount }) {
        const params = { pair };

        if (amount) params.amount = amount;

        const uri = this.buildUrl({ url: `${this.API_URI}offer`, params });

        const [serverError, response] = await Utils.to(
            Http.get({
                url: uri
            })
        );

        const errorMessage = this.errorMessage(serverError, response);

        if (errorMessage) return { error: errorMessage };

        return { error: null, response };
    }

    async getOrderStatus({ orderId }) {
        const uri = `${this.API_URI}order/${orderId}`;

        const [serverError, response] = await Utils.to(
            Http.get({
                url: uri
            })
        );

        const errorMessage = this.errorMessage(serverError, response);

        if (errorMessage) return { error: errorMessage };

        return { error: null, response };
    }

    async getOrdersInfo({ limit, page, sort }) {
        const params = {};

        if (limit) params.limit = limit;
        if (page) params.page = page;
        if (sort) params.sort = sort;

        const uri = buildUrl({ url: `${this.API_URI}ordersinfo/`, params });

        const [serverError, response] = await Utils.to(
            Http.get({
                url: uri
            })
        );
        const errorMessage = this.errorMessage(serverError, response);

        if (errorMessage) return { error: errorMessage };

        return { error: null, response };
    }

    async postOrder({ toAddress, refundAddress, pair, fromAmount, toAmount, signature, userIP }) {
        const uri = `${this.API_URI}order/`;

        const body = {
            toAddress,
            refundAddress,
            pair
        };

        if (fromAmount) {
            body.fromAmount = fromAmount;
        } else if (toAmount) {
            body.toAmount = toAmount;
        } else {
            console.log('switchainApiClient.postOrder.error.requiredFromAmountOrToAmountField');
        }

        if (signature) body.signature = signature;

        const headers = {};

        if (userIP) headers['x-user-ip'] = userIP;

        const [serverError, response] = await Utils.to(
            Http.post({
                url: uri,
                headers,
                options: {
                    data: JSON.stringify(body)
                }
            })
        );

        const errorMessage = this.errorMessage(serverError, response);

        if (errorMessage) return { error: errorMessage };

        return { error: null, response };
    }
}

export default APIWorker;
