<template>
    <nav class="main-menu">
        <ul>
            <li>
                <router-link to="/receive">
                    {{ $t('navigation.menu.button__receive') }}
                </router-link>
            </li>
            <li class="has-divider">
                <router-link to="/anonymize">
                    <percentage-to-hold-in-zerocoin-notification>
                        {{ $t('navigation.menu.button__mint') }}
                    </percentage-to-hold-in-zerocoin-notification>
                </router-link>
            </li>
            <li>
                <router-link to="/send/public">
                    Public Send
                </router-link>
            </li>
            <li>
                <router-link to="/send/private">
                    Private Send
                </router-link>
            </li>
            <li class ="has-divider">
                <router-link to="/znodes">
                    Znodes
                </router-link>
            </li>
            <li class="has-divider">
                <router-link to="/settings">
                    {{ $t('navigation.menu.button__settings') }}
                </router-link>
            </li>
            <li>
                <router-link to="/debugconsole">
                    Debug Console
                </router-link>
            </li>
        </ul>
    </nav>
</template>

<script>
import PercentageToHoldInZerocoinNotification from 'renderer/components/Notification/PercentageToHoldInZerocoinNotification'

export default {
    name: 'MainMenu',

    components: {
        PercentageToHoldInZerocoinNotification
    }
}
</script>

<style lang="scss" scoped>
$bleed: 2;
$bleed-active: 3;
$padding: 3;

ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

li {
    padding-left: emRhythm($bleed-active + $padding);
    padding-right: emRhythm($bleed-active + $padding);

    &.has-divider {
        border: 0px solid $color--comet-dark;
        @include rhythmBorderTop(1px, 2);
        margin-top: emRhythm(2);
    }
}

a {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    position: relative;
    @include setType(5);
    margin-bottom: emRhythm(1);
    border-radius: 0.25rem;
    color: $color--white-light;
    text-decoration: none;
    @include bleed-h($bleed);
    transition: padding .1s ease-in-out, margin .1s ease-in-out;

    &:after {
        position: absolute;
        content: '';
        display: block;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        background: $gradient--polo-vertical;
        opacity: 0;
        transition: opacity 0.15s ease-out;

    }

    &:hover,
    &:focus {
        &:after {
            opacity: .15;
        }
    }

    &.router-link-active {
        @include bleed-h($bleed-active);
        &:after {
            opacity: .3;
        }
    }

    .popover {
        width: 100%;
    }
}
</style>
