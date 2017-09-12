
import Muon from "muon-core"

import jwt from "jsonwebtoken"
import RSVP from "rsvp"
import fs from "fs"


export default class Aether {

    constructor(muon, loginProviders, accountRepository) {

        this.accountRepository = accountRepository
        this.muon = muon
        this.loginProviders = loginProviders


        this.privateKey = fs.readFileSync('./test/testing.pem')
        this.publicKey = fs.readFileSync('./test/testing.crt').toString()

        let _this = this

        this.muon.handle("/pubkey", (event, respond) => {
            respond(_this.publicKey)
        })
        this.muon.handle("/auth", (event, respond) => {
            _this.authorise(event.body).then((auth) => {
                respond(auth)
            }).catch((err) => respond(err))
        })
        //this.muon.handle("/social-register", (event, respond) => {
        //    _this.socialRegistrationProvider().authorise(event.body).then()
        //})
        //this.muon.handle("/social-login", (event, respond) => {
        //    _this.socialRegistrationProvider().authorise(event.body).then()
        //})
        this.muon.handle("/verify", (event, respond) => {
            _this.verify(event.body).then((auth) => {
                respond(auth)
            }).catch((error) => {
                respond(error)
            })
        })
    }

    /**
     *
     */
    authorise(principal) {
        var _this = this

        logger.trace("Authorising Principal: " + JSON.stringify(principal))

        function sign(grant) {
            return jwt.sign(grant, _this.privateKey, { algorithm: 'RS256'})
        }


        return new RSVP.Promise((resolve, reject) => {
            _this.loginProviders.authorise(principal).then((login) => {

                logger.debug("Principal is Authorised, using Login: " + JSON.stringify(login))

                //todo, only create the account if we want to. otherwise cerating one sprurious logs.

                _this.accountRepository.getOrCreateAccountByLogin(login).then((userDetail) => {

                    logger.debug("Login gives account: " + JSON.stringify(userDetail))

                    //what claims do we want ... ? TODO, derive them from the account?
                    // this is the permissions block ...
                    let token = sign({
                        username: userDetail.username
                    })
                    if('signature' in userDetail) {
                        token = sign({
                            signature: userDetail.signature
                        })
                    }


                    logger.debug("Generated Token: " + JSON.stringify(token))

                    resolve({
                        success: true,
                        token: token,
                        detail: userDetail
                    })
                }).catch((err) => {
                    console.dir(err)
                    reject(err)
                })
            }).catch((rejection) => {
              console.log("REJECTED" + JSON.stringify(rejection))
              reject(rejection)
            })
        })
    }

    /**
     * Cryptographically verify the given token is valid and hasn't been revoked
     *
     * Returns an RSVP promise
     *
     * //TODO, manage revocation.
     */
    verify(token) {
        var _this = this
        return new RSVP.Promise((resolve, reject) => {
            try {
                jwt.verify(token, _this.publicKey, (err, decoded) => {
                    if (err) {
                        reject({
                            verified: false,
                            error: err,
                            payload: decoded
                        })
                    } else {
                        resolve({
                            verified: true,
                            payload: decoded
                        })
                    }
                });
            } catch (e) {
                console.log("Failed to verify " + e)
                console.dir(e)
                reject({
                    verified: false,
                    error: e
                })
            }
        })
    }
}
