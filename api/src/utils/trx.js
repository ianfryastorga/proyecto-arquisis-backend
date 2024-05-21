const { WebpayPlus } = require('transbank-sdk');
const { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } = require('transbank-sdk'); // CommonJS Modules

let tx;

if (typeof global.__tx__ === 'undefined') {
  global.__tx__ = undefined;
}

if (process.env.NODE_ENV === "production") {
  tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));
} else {
  if (!global.__tx__) {
    global.__tx__ = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));
  }
  tx = global.__tx__;
}

module.exports = { tx };

