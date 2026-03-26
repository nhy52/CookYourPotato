import instance from './index.ts'

export interface UserProp {
    email: string,
    username?: string,
    password: string
}

export const initUserProp = {
    email: '',
    username: '',
    password: ''
}

export async function postLogin(data: UserProp){
    try{
        const resp = await instance.post('/auth/login', data)
        return resp
    }catch(e: any){
        console.error('<postLogin>',e)
        return e.response
    }
    
}

export async function postSignUp(data: UserProp){
    try{
        const resp = await instance.post('/auth/register', data)
        return resp
    }catch(e: any){
        console.error('<postSignUp>',e)
        return e.response
    }
    
}