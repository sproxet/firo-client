<template>
    <nav class="main-menu">
        <ul>
            <li>
                <router-link to="/receive">
                    {{ $t('navigation.menu.button__receive') }}
                </router-link>
            </li>
            <li>
                <router-link to="/send/private">
                    Send
                </router-link>
            </li>
            <div class="divider" />
            <li>
                <router-link to="/znodes">
                    Znodes
                </router-link>
            </li>
            <div class="divider" />
            <li>
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
@import "src/renderer/styles/colors";

ul {
    list-style: none;
    margin: 0;
    padding: 0;

    li {
        padding: {
            top: 1em;
            bottom: 1em;
            left: 3.5em;
            right: 3.5em;
        }

        &:hover {
            background-color: $color-menu-highlighted-element;
        }

        a {
            margin: 1em;
            border-radius: 0.25rem;
            text-decoration: none;
            color: inherit;
        }
    }

    .divider {
        height: 1px;
        background-color: $color-menu-divider;
    }
}
</style>
