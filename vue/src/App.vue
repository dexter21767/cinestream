<template>
    <div>

        <!-- install Modal -->
        <div id="installModal" ref='installModal' tabindex="-1" aria-hidden="true"
            class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full justify-center items-center">
            <div class="relative p-4 w-full max-w-2xl h-full md:h-auto">
                <!-- Modal content -->
                <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                    <!-- Modal header -->
                    <div class="modal-header">

                        <div class="flex justify-between items-start p-4 rounded-t border-b dark:border-gray-600">
                            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                                Install the addon
                            </h3>
                            <button @click="state.install.hide();" type="button"
                                class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                data-modal-toggle="defaultModal">
                                <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg" data-darkreader-inline-fill=""
                                    style="--darkreader-inline-fill:currentColor;">
                                    <path fill-rule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clip-rule="evenodd"></path>
                                </svg>
                                <span class="sr-only">Close modal</span>
                            </button>
                        </div>
                    </div>
                    <!-- Modal body -->
                    <div class="p-6 space-y-6">
                        <div>
                        <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                            Hello guys, if you enjoy this addon and want to keep working, and want new features to be added, Then please consider donating.</p>
                            <div style="align-items: center; display: flex; justify-content: center;">
                                <div style="margin: auto"> 
                                    <p>Buymeacoffee.com</p>
                                    <a href="https://www.buymeacoffee.com/dexter21767"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=dexter21767&button_colour=FF5F5F&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00" /></a>
                                </div>
                                <div style="margin: auto">
                                    <p>Ko-fi.com</p>
                                    <a href='https://ko-fi.com/G2G0H5KL5' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi3.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Modal footer -->
                    <div
                        class="flex items-center p-6 space-x-2 rounded-b border-t border-gray-200 dark:border-gray-600">
                        <a id="install_button" href="#"><button type="button"
                                class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Install
                                Addon</button></a>
                        <button type="button" @click="state.install.hide();"
                            class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-img relative min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-gray-500 bg-no-repeat bg-cover bg-center relative items-center"
            :style="`background-image: url(${manifest.background});`">
            <div class="absolute bg-black opacity-60 inset-0 z-0"></div>
            <div class="max-w-md w-full space-y-8 p-10 bg-white shadow-lg rounded-xl z-10">


                <div class="grid gap-8 grid-cols-1">
                    <div class="flex flex-col ">
                        <div class="items-center header">
                            <img class="logo" :src="manifest.logo">
                            <h1 class="font-semibold text-lg mr-auto">{{ manifest.name }}</h1>
                            <h2 class="font-semibold text-lg mr-auto" style="text-align: right;">Version: {{
                                    manifest.version
                            }}</h2>
                            <p class="mt-5">{{ manifest.description }}</p>
                        </div>

                        <div class="flex items-center justify-center space-x-2 mt-5">
                            <span class="h-px w-full bg-gray-200"></span>
                        </div>

                        <div class="items-center mt-5 description">
                            <h2 class="font-semibold text-lg mr-auto">This addon has more:</h2>
                            <ul v-html="stylizedTypes.map(t => `<li>${t}</li>`).join('')"></ul>
                        </div>

                        <div class="flex items-center justify-center space-x-2 mt-5">
                            <span class="h-px w-full bg-gray-200"></span>
                        </div>


                        <div class="mt-10 flex flex-col">
                            <button @click="state.install.show(); generateInstallUrl();" type="button"
                                class="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Install
                                Addon</button>
                        </div>


                        <div class="mt-5 flex flex-col">
                            <p class="text-center text-gray-400">This addon was created by:
                                <a href="https://github.com/dexter21767" target="_blank"
                                class="text-purple-700">dexter21767</a>
                                <br/> UI by: 
                                <a href="https://github.com/rleroi" target="_blank" 
                                class="text-purple-700">rab1t</a>
                                <br> Background by:
                                <a href="https://www.deviantart.com/reiphantomhive1" target="_blank" 
                                class="text-purple-700">reiphantomhive1</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>


        <!-- <SearchModal ref="searchModal" @addList="addList" :searchQuery="state.searchQuery"></SearchModal> -->
    </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import Modal from 'flowbite/src/components/modal';
import { useHead } from "@vueuse/head";
import * as manifest from '../../manifest.json';

const stylizedTypes = manifest.types.map(t => t[0].toUpperCase() + t.slice(1));

const Consts = {};

useHead({
    title: manifest.name + ' - Stremio Addon',
    link: [
        {
            rel: "icon",
            type: "image/svg+xml",
            href: manifest.logo,
        }
    ],
})

const state = reactive({
    install: null,
});

const installModal = ref();

onMounted(() => {
    Consts.currentUrl = (window.location.origin == "http://localhost:5173") ? 'http://127.0.0.1:63355' : window.location.origin;
    Consts.Config = (window.location.pathname && window.location.pathname.split('/'))?Consts.Config = window.location.pathname.replace('configure','').replaceAll('/',''):undefined;
    generateInstallUrl()
    state.install = new Modal(installModal.value);
});


function generateInstallUrl() {
    const location = window.location.host + '/manifest.json'
    document.getElementById("install_button").href = 'stremio://' + location;
}

</script>


<style scoped>
h1 {
    font-size: x-large;
    text-align: center;
    color: blue;
    padding-top: 10px;
}

.logo {
    margin: auto;
    max-width: 200px;
}

.bg-img {
    background: fixed;
    background-size: cover;
    background-position: center center;
    background-repeat: repeat-y;
}


/* Header fixed to the top of the modal */
.modal-header {
    position: sticky;
    top: 0;
    background-color: inherit;
    /* [1] */
    z-index: 1055;
    /* [2] */
}
</style>