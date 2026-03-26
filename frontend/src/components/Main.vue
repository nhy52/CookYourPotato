<template>
    <div class="grid h-full justify-center align-center">
        <div class="grid gap-4" style="width: 300px;">
            <div class="flex-col flex gap-2 justify-center">
                <form v-if="!isSignUp" class="flex-col flex gap-2 justify-center" @submit.prevent="handleLogin()">
                    <h1 class="text-lg">Welcome to my web</h1>
                    <div class="flex flex-col">
                        <label>Email</label>
                        <InputText type="text" v-model="userInput.email" />
                    </div>
                    <div class="flex flex-col">
                        <label>Password</label>
                        <InputText type="password" v-model="userInput.password" />
                    </div>
                    <Button label="Sign in" type="submit"/>
                    <a href="javascript:" @click="handleGoSignUp()">Sign up</a>
                </form>
                <form v-else class="flex-col flex gap-2 justify-center" @submit.prevent="handleSignUp()">
                    <h1>Welcome to my web</h1>
                    <div class="flex flex-col">
                        <label>Email</label>
                        <InputText type="text" v-model="userInput.email" />
                    </div>
                    <div class="flex flex-col">
                        <label>Password</label>
                        <InputText type="password" v-model="userInput.password" />
                    </div>
                    <div class="flex flex-col">
                        <label>Name</label>
                        <InputText type="text" v-model="userInput.username" />
                    </div>
                    <Button label="Sign up" type="submit"/>
                    <a href="javascript:" @click="handleGoSignUp()">Sign in</a>
                </form>

            </div>

        </div>
    </div>

</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
    postLogin, 
    postSignUp,
    type UserProp,
    initUserProp
} from '@/api/user'
import { useAuthStore } from '@/stores/auth'

const storeAuth = useAuthStore()
const router = useRouter()
const userInput = ref<UserProp>({
    username: '',
    email: '',
    password: ''
})
const isSignUp = ref(false)

async function handleLogin(){
    const resp = await postLogin({
        email: userInput.value.email,
        password: userInput.value.password
    })

    if(resp.status == 200 || resp.status == 201){
        userInput.value = {...initUserProp}
        window.alert(`Success`)
        storeAuth.setAuth({
            ...resp.data,
            ...userInput.value
        })
    }else{
        window.alert(`[ERROR] ${resp.data.message} - (${resp.data.error} / ${resp.data.statusCode})`)
    }
    // console.log(resp)
}

async function handleSignUp(){
    const resp = await postSignUp({...userInput.value})
    // console.log(resp)
    if(resp.status == 200 || resp.status == 201){
        userInput.value = {...initUserProp}
        window.alert(`Success`)
        isSignUp.value = false
    }else{
        window.alert(`[ERROR] ${resp.data.message} - (${resp.data.error} / ${resp.data.statusCode})`)
    }
}

function handleGoSignUp(){
    userInput.value = {...initUserProp}
    isSignUp.value = !isSignUp.value
}

</script>