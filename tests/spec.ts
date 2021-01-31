import path from 'path';
import os from 'os';
import fs from 'fs';
import {assert} from 'chai';
import {Application} from 'spectron';
import electron from 'electron';
import {convertToSatoshi} from "../src/lib/convert";
import {TransactionOutput} from "../src/daemon/firod";

interface This extends Mocha.Context {
    app: Application
}

if (process.env.BUILD_FIRO_CLIENT !== 'false') {
    before(async function () {
        this.timeout(1000e3); // Make sure we have enough time to build our app.
        await require('../electron-vue/build');
    });
}

const passphrase = 'passphrase';
let mnemonicWords: string[];

function scaffold(this: Mocha.Suite, reinitializeFiroClient: boolean) {
    this.timeout(5e3);
    this.slow(500);

    this.beforeAll(async function (this: This) {
        this.timeout(10e3);

        this.app = new Application({
            path: <any>electron, // the type annotation for path is incorrect
            args: [path.join(__dirname, '..', 'dist', 'electron', 'main.js'), '--test-print'],
            env: {
                FIRO_CLIENT_TEST: 'true',
                REINITIALIZE_FIRO_CLIENT: String(reinitializeFiroClient)
            }
        });

        console.info('Starting Firo Client...');
        await this.app.start();
        await this.app.client.waitUntilWindowLoaded();
        console.info('Firo Client started.');
    });

    this.afterEach(async function (this: This) {
        // Getting these will clear the logs.
        const mainLogs = await this.app.client.getMainProcessLogs();
        const rendererLogs = await this.app.client.getRenderProcessLogs();

        if (this.currentTest.state === 'failed') {
            console.error('Main process logs:');
            console.error(mainLogs.join("\n"));
            console.error('Renderer process logs:');
            console.error(rendererLogs.join("\n"));
        }
    });

    this.afterAll(async function (this: This) {
        this.timeout(10e3);
        await this.app.stop();
    });
}

if (!process.env.USE_EXISTING_WALLET_FOR_TEST) {
    describe('Regtest Setup', function (this: Mocha.Suite) {
        scaffold.bind(this)(true);

        it('opens a window', async function (this: This) {
            assert.equal(await this.app.client.getWindowCount(), 1);
        });

        it('starts', async function (this: This) {
            const startButton = await this.app.client.$('button');
            await startButton.waitForExist();
            await startButton.click();

            await (await this.app.client.$('select')).waitForExist();
        });

        it('allows selecting blockchain location and network', async function (this: This) {
            this.slow(1e3);

            await (await this.app.client.$('select')).selectByAttribute('value', 'regtest');

            const defaultDataDirLocation = await (await this.app.client.$('#datadir-value')).getText();
            // os.tmpdir() isn't actually unique. :-/
            const dataDirLocation = path.join(os.tmpdir(), `firo-client-test-${Math.floor(Math.random() * 1e16)}`);

            fs.mkdirSync(dataDirLocation);

            // Creating a new directory is in normal usage taken care of by the file selection dialog, which can't be automated.
            const setDataDirJS = `e = new Event('set-data-dir'); e.dataDir = ${JSON.stringify(dataDirLocation)}; document.dispatchEvent(e)`;

            // Set the data dir to the test location.
            await this.app.webContents.executeJavaScript(setDataDirJS);
            await this.app.client.waitUntilTextExists('#datadir-value', dataDirLocation);

            // Test resetting the data dir.
            await (await this.app.client.$('#reset-data-dir')).click();
            await this.app.client.waitUntilTextExists('#datadir-value', defaultDataDirLocation);


            // Set it back to the real (test) location.
            await this.app.webContents.executeJavaScript(setDataDirJS);
            await this.app.client.waitUntilTextExists('#datadir-value', dataDirLocation);


            await (await this.app.client.$('button')).click();
            await (await this.app.client.$('.select-create-or-restore')).waitForExist();
        });

        it('correctly displays and confirms mnemonic', async function (this: This) {
            this.timeout(5000e3);
            this.slow(5e3);

            await (await this.app.client.$('#create-new-wallet')).click();
            await (await this.app.client.$('.write-down-mnemonic')).waitForExist();

            mnemonicWords = await Promise.all((await this.app.client.$$('.mnemonic-word')).map(e => e.getText()));
            assert.equal(mnemonicWords.length, 24);

            await (await this.app.client.$('#confirm-button')).click();
            await (await this.app.client.$('.confirm-mnemonic')).waitForExist();

            const wordElements = await this.app.client.$$('.mnemonic-word');
            const okButton = await this.app.client.$('#ok-button');
            let lastHiddenIndex: number;

            for (const [n, wordElement] of wordElements.entries()) {
                const classNames = <string>await wordElement.getAttribute('class');
                if (classNames.includes('hidden')) {
                    lastHiddenIndex = n;
                    await wordElement.setValue(mnemonicWords[n]);
                } else {
                    assert.equal(await wordElement.getText(), mnemonicWords[n]);
                }
            }

            await okButton.waitForClickable();

            // Test incorrect words.
            await wordElements[lastHiddenIndex].setValue('invalid-word');
            await okButton.waitForClickable({reverse: true});

            // Set it back to the valid word.
            await wordElements[lastHiddenIndex].setValue(mnemonicWords[lastHiddenIndex]);
            await okButton.waitForClickable();

            await okButton.click();

            await (await this.app.client.$('#passphrase')).waitForExist();
        });

        it('goes back from the passphrase step', async function (this: This) {
            await (await this.app.client.$('#back-button')).click();
            await (await this.app.client.$('.confirm-mnemonic')).waitForExist();

            const wordElementsAgain = await this.app.client.$$('.mnemonic-word');
            for (const [n, wordElement] of wordElementsAgain.entries()) {
                const classNames = <string>await wordElement.getAttribute('class');
                if (!classNames.includes('hidden')) {
                    assert.equal(await wordElement.getText(), mnemonicWords[n]);
                }
            }

            await (await this.app.client.$('#back-button')).click();
            await (await this.app.client.$('.write-down-mnemonic')).waitForExist();

            const nonHiddenWordElementsAgain = await this.app.client.$$('.mnemonic-word');
            for (const [n, wordElement] of nonHiddenWordElementsAgain.entries()) {
                assert.equal(await wordElement.getText(), mnemonicWords[n]);
            }

            await (await this.app.client.$('#back-button')).click();
            await (await this.app.client.$('#recover-from-mnemonic')).waitForExist();
        });

        it('can recover from mnemonics', async function (this: This) {
            this.timeout(1000e3);

            let twelveMnemonicWords = ["nation","tip","mean","govern","tide","comic","figure","gift","upper","love","kitchen","dolphin"];

            await (await this.app.client.$('#recover-from-mnemonic')).click();

            const submitButton = await this.app.client.$('#ok-button');

            await (await this.app.client.$('input[value="12"]')).click();
            // FIXME: There is a bug in WebdriverIO.Element.waitForExists({reverse: true}), so we just do a short fixed wait
            //        to be sure everything is updated.
            await new Promise(r => setTimeout(r, 20));

            const twelveMnemonicWordElements = await this.app.client.$$('input.mnemonic-word');
            for (const [n, word] of Object.entries(twelveMnemonicWords)) {
                await twelveMnemonicWordElements[n].setValue(word);
            }

            await submitButton.waitForClickable();

            twelveMnemonicWordElements[0].setValue('invalid-word');
            await submitButton.waitForClickable({reverse: true});

            await (await this.app.client.$('input[value="24"]')).click();
            await new Promise(r => setTimeout(r, 20)); // FIXME: see above

            const twentyFourMnemonicWordElements = await this.app.client.$$('input.mnemonic-word');
            for (const [n, word] of Object.entries(mnemonicWords)) {
                await twentyFourMnemonicWordElements[n].setValue(word);
            }

            await submitButton.waitForClickable();

            twentyFourMnemonicWordElements[0].setValue('invalid-word');
            await submitButton.waitForClickable({reverse: true});

            twentyFourMnemonicWordElements[0].setValue(mnemonicWords[0]);
            await submitButton.waitForClickable();

            await submitButton.click();
            await (await this.app.client.$('#passphrase')).waitForExist();
        });

        it('locks the wallet', async function (this: This) {
            this.timeout(60e3);
            this.slow(20e3);

            const submitButton = await this.app.client.$('#ok-button');

            await (await this.app.client.$('#passphrase')).setValue(passphrase);
            await (await this.app.client.$('#confirm-passphrase')).setValue(passphrase);
            await submitButton.waitForClickable();

            await (await this.app.client.$('#confirm-passphrase')).setValue(passphrase + 'invalid');
            await submitButton.waitForClickable({reverse: true})

            await (await this.app.client.$('#confirm-passphrase')).setValue(passphrase);
            await submitButton.waitForClickable();

            await submitButton.click();

            await (await this.app.client.$('.transactions-page')).waitForExist({timeout: 60e3});
        });

        it('generates FIRO from the debug console', async function (this: This) {
            this.timeout(500e3);
            this.slow(100e3);

            await (await this.app.client.$('a[href="#/debugconsole"]')).click();

            await this.app.client.keys([..."generate 1000".split(''), "Enter"]);
            await this.app.client.waitUntil(
                async () => (await (await this.app.client.$('#current-input')).getText()) === '',
                {timeout: 500e3}
            );
        });

        it('has the correct balance after generating FIRO from the debug console', async function (this: This) {
            await this.app.client.waitUntilTextExists('.public .amount', '38343');
            await this.app.client.waitUntilTextExists('.pending .amount', '4300');
        });
    });
}

describe('Opening an Existing Wallet', function (this: Mocha.Suite) {
    scaffold.bind(this)(false);

    it('loads our existing wallet', async function (this: This) {
        this.timeout(20e3);
        this.slow(20e3);

        // Check that there are existing payments.
        const paymentStatusElement = await this.app.client.$('td');
        await paymentStatusElement.waitForExist({timeout: 20e3});
    });

    it('has a non-zero balance', async function (this: This) {
        // This value doesn't actually _have_ to be above 1 if we're testing with an existing firod, but in a test
        // environment we've probably made some error and it's best to check for that now.
        const balanceElements = await this.app.client.$$('.balance .amount');
        const balance = (await Promise.all(balanceElements.map(async e =>
            Number(await e.getText())
        ))).reduce((a, x) => a + x, 0);
        assert.isAbove(balance, 1);
    });

    it('displays and updates the receiving address', async function (this: This) {
        this.timeout(10e3);

        await (await this.app.client.$('a[href="#/receive"]')).click();

        const receiveAddressElement = await this.app.client.$('a.address');
        await receiveAddressElement.waitForExist();

        let originalReceiveAddress = await receiveAddressElement.getText();
        await this.app.client.executeAsyncScript(`$daemon.legacyRpc('generatetoaddress 1 ${originalReceiveAddress}').then(arguments[0])`, []);
        await this.app.client.waitUntil(async () => (await receiveAddressElement.getText()) !== originalReceiveAddress);
    });

    it('sends and receives a private payment', async function (this: This) {
        this.timeout(60e3);
        this.slow(30e3);

        let nonce = String(Math.random());
        let receiveAddress = await this.app.client.executeAsyncScript(`$daemon.getUnusedAddress().then(arguments[0])`, []);

        await (await this.app.client.$('a[href="#/send')).click();
        await (await this.app.client.$('#send-page')).waitForExist();

        const sendButton = await this.app.client.$('#send-button');
        const label = await this.app.client.$('#label')
        const address = await this.app.client.$('#address');
        const amount = await this.app.client.$('#amount');

        // Set up a valid form.

        await label.setValue(nonce);
        await address.setValue(receiveAddress);
        await amount.setValue('1');
        await sendButton.waitForEnabled();

        // Check validations

        await amount.setValue('0.0000000001');
        await sendButton.waitForEnabled({reverse: true});
        // There is a WebdriverIO bug where the old value is not cleared if we're changed too quickly.
        await new Promise(r => setTimeout(r, 100));
        await amount.setValue('1');
        await sendButton.waitForEnabled();

        await amount.setValue('99999999999999');
        await sendButton.waitForEnabled({reverse: true});
        await amount.setValue('1');
        await sendButton.waitForEnabled();

        await address.setValue('invalid-address');
        await sendButton.waitForEnabled({reverse: true});
        // There is a WebdriverIO bug where the old value is not cleared if we're changed too quickly.
        await new Promise(r => setTimeout(r, 100));
        await address.setValue(receiveAddress);
        await sendButton.waitForEnabled();

        await sendButton.click();

        const cancelButton = await this.app.client.$('button.cancel');
        await sendButton.waitForEnabled({reverse: true});
        await cancelButton.click();

        await sendButton.waitForEnabled({reverse: true});
        await sendButton.click();

        const confirmButton = await this.app.client.$('button.confirm');
        await sendButton.waitForEnabled();
        await confirmButton.click();

        const passphraseInput = await this.app.client.$('input[type="password"]');
        await passphraseInput.waitForExist();
        await passphraseInput.setValue(passphrase + '-invalid');

        const realSendButton = await this.app.client.$('button.confirm');
        await realSendButton.click();

        await (await this.app.client.$('.passphrase-input .error')).waitForExist();

        const passphraseInput2 = await this.app.client.$('input[type="password"]');
        await passphraseInput2.setValue(passphrase);

        const realSendButton2 = await this.app.client.$('button.confirm');
        await realSendButton2.click();

        // The type signature of timeout on waitUntilTextExists is incorrect.
        await this.app.client.waitUntilTextExists('.spendOut-label', nonce, <any>{timeout: 10e3});
        await this.app.client.waitUntilTextExists('.spendIn-label', nonce, <any>{timeout: 10e3});

        const txOut: TransactionOutput = await this.app.client.executeScript(
            "return Object.values($store.getters['Transactions/transactions']).find(tx => tx.label === arguments[0] && tx.category === 'spendOut' && !tx.isChange)",
            [nonce]
        );
        assert.equal(txOut.fee + txOut.amount, 1e8);

        const txIn: TransactionOutput = await this.app.client.executeScript(
            "return Object.values($store.getters['Transactions/transactions']).find(tx => tx.label === arguments[0] && tx.category === 'spendIn' && !tx.isChange)",
            [nonce]
        );
        assert.equal(txIn.amount, 1e8 - txOut.fee);
    });

    it('sends with a custom tx fee not subtracted from amount', async function (this: This) {
        this.timeout(30e3);
        this.slow(20e3);

        await this.app.client.executeAsyncScript("$daemon.legacyRpc('generate 1').then(arguments[0])", []);

        const nonce = String(Math.random());

        await (await this.app.client.$('a[href="#/send/public')).click();
        await (await this.app.client.$('.send-firo-form')).waitForExist();

        await (await this.app.client.$('#label')).setValue(nonce);
        await (await this.app.client.$('#address')).setValue('TAczBFWtiP8mNstdLn1Z383z51rZ1vHk5N');
        await (await this.app.client.$('#amount')).setValue('1');
        await (await this.app.client.$('#subtract-fee-from-amount-checkbox')).click();
        await (await this.app.client.$('#use-custom-fee-checkbox')).click();
        // There is a bug in WebdriverIO where the default text will not be erased, so this will end up as a 1111
        // satoshi fee. The test logic will work whether or not that bug is fixed.
        await (await this.app.client.$('#custom-fee')).setValue('111');

        const sendButton = await this.app.client.$('#send-button');
        // There is a WebdriverIO bug where this call takes a couple seconds to complete after the element is enabled.
        await sendButton.waitForEnabled();
        sendButton.click();

        const confirmButton = await this.app.client.$('#confirm-button');
        await confirmButton.waitForEnabled();
        await confirmButton.click();

        const passphraseInput = await this.app.client.$('#passphrase');
        await passphraseInput.waitForExist();
        await passphraseInput.setValue(passphrase);

        await (await this.app.client.$('#confirm-passphrase-send-button')).click();

        // The type signature of waitUntilTextExists is incorrect.
        await this.app.client.waitUntilTextExists('.send-label', nonce, <any>{timeout: 10e3});

        const tx: TransactionOutput = await this.app.client.executeScript(
            "return Object.values($store.getters['Transactions/transactions']).find(tx => tx.label === arguments[0] && !tx.isChange)",
            [nonce]
        );
        assert.isAtLeast(tx.fee, 111);
        assert.equal(tx.amount, 1e8);
    });

    it('changes the passphrase', async function (this: This) {
        await (await this.app.client.$('a[href="#/settings"]')).click();

        const currentPassphrase = await this.app.client.$('#current-passphrase');
        const newPassphrase = await this.app.client.$('#new-passphrase');
        const confirmNewPassphrase = await this.app.client.$('#confirm-new-passphrase');
        const changePassphraseButton = await this.app.client.$('#change-passphrase-button');

        await currentPassphrase.waitForExist();
        await currentPassphrase.setValue(passphrase + '-invalid');
        await newPassphrase.setValue(passphrase + '_');
        await confirmNewPassphrase.setValue(passphrase + '_');
        await changePassphraseButton.click();

        const closeButton = await this.app.client.$('.close-dialog-button > a');
        await closeButton.waitForExist();

        await (await this.app.client.$('#passphrase-change-error')).waitForExist();
        await closeButton.click();

        await currentPassphrase.setValue(passphrase);
        await confirmNewPassphrase.setValue(passphrase + '__');
        await changePassphraseButton.waitForEnabled({reverse: true});

        await confirmNewPassphrase.setValue(passphrase + '_');
        await changePassphraseButton.waitForEnabled();
        await changePassphraseButton.click();

        await closeButton.waitForExist();
        assert(await (await this.app.client.$('#passphrase-change-successful')).isExisting());
        await closeButton.click();

        await this.app.client.executeAsyncScript(
            "$daemon.setPassphrase(arguments[0], arguments[1]).then(arguments[2])",
            [passphrase + "_", passphrase]
        );
    });

    it('responds to input properly in the debug console', async function (this: This) {
        await (await this.app.client.$('a[href="#/debugconsole"]')).click();

        const currentInput = await this.app.client.$('#current-input')

        await this.app.client.keys([..."garbage-input-1".split(''), "Enter"]);
        await this.app.client.waitUntil(async () => (await currentInput.getText()) === '');

        await this.app.client.keys([..."garbage-input-2".split(''), "Enter"]);
        await this.app.client.waitUntil(async () => (await currentInput.getText()) === '');

        await this.app.client.keys(["ArrowUp"]);
        await this.app.client.waitUntil(async () => (await currentInput.getText()) === 'garbage-input-2');

        await this.app.client.keys(["ArrowUp"]);
        await this.app.client.waitUntil(async () => (await currentInput.getText()) === 'garbage-input-1');

        await this.app.client.keys(["ArrowDown"]);
        await this.app.client.waitUntil(async () => (await currentInput.getText()) === 'garbage-input-2');

        await this.app.client.keys(["ArrowDown"]);
        await this.app.client.waitUntil(async () => (await currentInput.getText()) === '');
    });
});