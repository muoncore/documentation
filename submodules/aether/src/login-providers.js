
import Muon from "muon-core"

import jwt from "jsonwebtoken"
import RSVP from "rsvp"
import fs from "fs"

import {socialLoginProvider} from './social-provider'

/**
 * TODO, maintain a registry or config of permissable login providers.
 */
export default class AetherLoginProviders {

    constructor(muon) {
        this.muon = muon
        this.socialLoginProvider = new socialLoginProvider()
    }

    authorise(principal) {
        var _this = this

        return new RSVP.Promise((resolve, reject) => {


            switch(principal.type) {
                case "password":
                    _this.muon.request("rpc://aether-password/auth", principal).then((response) => {
                        if (response.body.success) {
                            resolve(response.body)
                        } else {
                            reject(response.body)
                        }
                    }).catch((err) => reject(err))
                    break
                case "social":
                    this.socialLoginProvider.auth(principal).then(response => {

                      if(response.success) {
                        resolve(response)
                      } else {
                        reject(response)
                      }
                    }).catch(err => {
                      console.log('Promise went wrong');
                      console.log(err)
                      reject(err)
                    })
                    break
                default:
                    reject({
                        success:false,
                        provider: "password"
                    })
            }
        })
    }
}
