<template>
    <div class="send-confirmation-wait-animation">
        <lottie
            :options="defaultOptions"
            @animCreated="handleAnimation"
        />
    </div>
</template>

<script>
import Lottie from 'vue-lottie'
import animationData from 'renderer/assets/animations/confirmation-wait-v3.json'

export default {
    name: 'SendConfirmationWait',
    components: {
        Lottie
    },
    props: {
        received: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            defaultOptions: {
                animationData,
                loop: false,
                autoplay: false
            }
        }
    },

    watch: {
        received (newVal, oldVal) {
            if (newVal) {
                this.anim.play()
            }
        }
    },
    methods: {
        handleAnimation (anim) {
            this.anim = anim

            if (this.received) {
                this.anim.goToAndStop(this.anim.getDuration(true), true)
            }
        },

        stop () {
            this.anim.stop()
        },

        play () {
            this.anim.play()
        },

        pause () {
            this.anim.pause()
        },

        onSpeedChange () {
            this.anim.setSpeed(this.animationSpeed)
        }
    }
}
</script>

<style lang="scss" scoped>
</style>
