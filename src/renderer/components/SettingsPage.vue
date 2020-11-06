<template>
    <div class="settings-page">
        <Popup v-if="error">
            <ErrorStep :error="error" />
        </Popup>

        <div class="pure-buttons">
            <button @click="openBackupDialog">
                Backup Wallet
            </button>

            <button @click="showSetupScreenAgain">
                Show Setup Screen Again
            </button>
        </div>

        <div class="tor-settings">
            <div class="guidance">
                Enabling Tor will increase your anonymity by hiding the IP address you connect to the Firo network with.
            </div>

            <div class="tor-checkbox-line">
                <input type="checkbox" v-model="useTor" />
                <label>
                    Connect to Other Nodes via Tor
                </label>
            </div>
        </div>

        <hr />

        <div class="detail-buttons">
            <button @click="() => showDetail = 'passphrase'">
                Change Passphrase
            </button>

            <button v-if="hasMnemonic" @click="showMnemonicRecoveryPhrase">
                Show My Mnemonic Recovery Phrase
            </button>
        </div>

        <div class="detail">
            <div v-if="showDetail == 'passphrase'">
                <div class="field">
                    <label>Current Passphrase:</label>
                    <input type="password" v-model="currentPassphrase" />
                </div>

                <div class="field">
                    <label>New Passphrase:</label>
                    <input type="password" v-model="newPassphrase" :class="{matching: passphrasesMatch}" />
                </div>

                <div class="field">
                    <label>Confirm Passphrase:</label>
                    <input type="password" v-model="confirmPassphrase" :class="{matching: passphrasesMatch}" />
                </div>
            </div>

            <SmallMnemonic v-if="showDetail === 'mnemonic'" :words="mnemonicWords" />
        </div>
    </div>
</template>

<script>
import {mapGetters} from 'vuex'
import {remote} from 'electron';
import Popup from './Popup';
import ErrorStep from "./SendPage/ErrorStep";
import {IncorrectPassphrase} from "daemon/zcoind";

export default {
    name: 'SettingsPage',

    components: {
        Popup,
        ErrorStep,
        SmallMnemonic
    },

    computed: {
        ...mapGetters({
            apiStatus: 'ApiStatus/apiStatus',
            hasMnemonic: 'ApiStatus/hasMnemonic'
        }),

        passphrasesMatch () {
            return !this.confirmNewPassphrase || this.newPassphrase === this.confirmNewPassphrase;
        },

        canChangePassphrase () {
            return this.currentPassphrase && this.newPassphrase && (this.newPassphrase === this.confirmNewPassphrase);
        }
    },

    data () {
        return {
            useTor: $store.getters['Settings/isConnectedViaTor'],
            showDetail: 'passphrase', // 'passphrase' | 'mnemonic'
            currentPassphrase: '',
            newPassphrase: '',
            confirmNewPassphrase: '',
        }
    },

    watch: {
        async useTor() {
            $setWaitingReason("Restarting daemon...");
            await $daemon.updateSettings({torsetup: this.useTor ? '1' : '0'});
            await $daemon.stopDaemon();
            await $startDaemon();
        }
    },

    methods: {

        async changePassphrase() {
            if (!this.canChangePassphrase) {
                return;
            }

            try {
                await $daemon.setPassphrase(this.currentPassphrase, this.newPassphrase);
            } catch (e) {
                if (e instanceof IncorrectPassphrase) {
                    this.error = 'Incorrect Passphrase';
                } else {
                    this.error = `${e}`;
                }
            }

            this.currentPassphrase = '';
            this.newPassphrase = '';
            this.confirmNewPassphrase = '';
        },

        async closeMnemonicDialog() {
            this.showMnemonicSetting = false;
        },

        // This also needs to be called on popover auto-close to cleanup data.
        closePassphrasePopover() {
            this.changePassphraseError = '';
            this.openPassphrasePopover = false;
        },

        async openBackupDialog() {
            const selected = await remote.dialog.showOpenDialog({
                title: "Select Backup File Directory",
                buttonLabel: "Select Backup File Directory",
                properties: [
                    'createDirectory',
                    'openDirectory'
                ]
            });

            const backupDirectory = selected.filePaths[0];
            if (!backupDirectory) return;

            this.popoverStep = 'wait';

            try {
                await $daemon.backup(backupDirectory);
                this.popoverStep = 'success';
            } catch (e) {
                this.errorMessage = (e.error && e.error.message) ? e.error.message : String(e);
                this.popoverStep = 'error';
            }
        },

        openMnemonicSettings() {
            this.showMnemonicSetting = true;
        },

        closePopover() {
            this.popoverStep = 'initial';
        },

        async showSetupScreenAgain() {
            if (!confirm("Are you sure you want to reset the configuration?")) {
                return;
            }

            this.$store.commit('App/setIsInitialized', false);
            await $quitApp();
        }
    },
}
</script>

<style lang="scss" scoped>
.version {
    font: {
        style: italic;
        weight: normal;
        size: 0.5em;
    }
}

.settings-page {
    box-sizing: border-box;
    overflow-y: auto;
}

.settings-page-inner {
    padding: emRhythm(5) emRhythm(8) emRhythm(5) emRhythm(4);
}

.interface .form {
    .language-settings {
        .control {
            margin-left: emRhythm(-2);
        }
    }
}

.passphrase {
    display: table;

    .line {
        display: table-row;

        .left, .right {
            display: table-cell;
            width: max-content;
        }
    }

    .form {
        width: max-content;

        .field {
            display: table-row;

            label, input {
                display: table-cell;
            }

            label {
                padding-right: 2em;
            }

            input {
                background-color: $color--comet-medium;
                border: none;
                height: 1.5em;
                width: 30em;

                &.non-matching {
                    outline-style: auto;
                    outline-color: red;
                }
            }
        }
    }
}

.close-dialog-button {
    margin-top: 0.5em;
    margin-right: 1em;
    margin-bottom: -2em;
    text-align: right;
    a {
        color: white;
    }
}

.mnemonic-setting {
    margin-top: 20px;
    margin-bottom: 20px;
}

.show-setup-screen-again {
    margin-top: 1em;
}
</style>
