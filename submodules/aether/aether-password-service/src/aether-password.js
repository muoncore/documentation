import Muon from "muon-core"
import {api as Sodium} from "sodium"
import jwt from "jsonwebtoken"
import RSVP from "rsvp"
import fs from "fs"

/**
 * Service that authenticates password principals
 */
export default class AetherPassword {

  constructor(muon) {

    this.muon = muon
    let _this = this
    _this.userdb = {}

    this.muon.handle("/auth", (event, respond) => {
      logger.warn("Starting auth")
      _this.authorise(event.body).then((auth) => {
        respond(auth)
      }).catch((error) => {
        logger.error("Failed to auth", error)
        respond(error)
      })
    })

    this.muon.handle("/register", (event, respond) => {
      console.log("WELCOME TO AETHER REGISTRATION")
      try {
        var password = Buffer.from(event.body.password.trim(), "utf8")

        var hash = Sodium.crypto_pwhash_str(
          password,
          Sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
          Sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE);

        logger.warn("Username " + event.body.username + " hashed pword " + hash)

        var principal = {
          username: event.body.username,
          passwordHash: hash.toString("utf8"),
        }

        var pwordUpdated = {
          "event-type": "UserPasswordUpdated",
          "schema": "http://www.simplicityitself.io/slack/1",
          "stream-name": "aether-password-registration",
          "service-id": "aether-password",
          payload: principal
        }

        _this.muon.emit(pwordUpdated).then(function (resp) {
          logger.warn("Aether Registration Persisted" + JSON.stringify(resp))
          respond({
            success:true
          })
        }).catch(function (error) {
          logger.warn("Aether Registration FAILED " + JSON.stringify(error))
          respond({
            success:false,
            error: error
          })
        })
      } catch (e) {
        console.log("IT BROKED")
        console.dir(e)
        respond(e)
      }
    })

    function connect() {
      _this.muon.replay("aether-password-registration", {}, function (event) {
        _this.addUser(event.payload).then((msg) => {
          console.log("User Added " + JSON.stringify(msg))
        }).catch((err) => {
          console.log("Error Processing User Password Update " + JSON.stringify(err))
        })
      }, function (error) {
        console.log("Disconnected from event store, reconnecting ", error)
        setTimeout(connect, 1000)
      }, function (complete) {
        console.log("Completed!")
        setTimeout(connect, 1000)
      })
    }

    connect()
  }

  /**
   * Auth a given principal, returning a user info if found and correct
   *
   * {
     *   type:"password",
     *   username: "xxx",
     *   password: "xxxx"
     * }
   *
   */
  authorise(principal) {
    var _this = this

    return new RSVP.Promise((resolve, reject) => {

      // lookup the given user
      let user = _this.getUser(principal.username)

      if (!user) {
        reject({
          id: principal.username,
          type: "password",
          success: false,
          message: "No user with the username '" + principal.username + "' or the password doesn't match"
        })
        return
      }

      var hash = new Buffer(128)
      hash.fill(null)
      hash.write(user.passwordHash, "utf8")

      try {
        var inPass = Buffer.from(principal.password.trim(), 'utf8');

        var isValid = Sodium.crypto_pwhash_str_verify(hash, inPass);

        if (!isValid) {
          reject({
            id: principal.username,
            type: "password",
            success: false,
            message: "No user with the username '" + principal.username + "' or the password doesn't match"
          })
          return
        }

        resolve({
          id: principal.username,
          type: "password",
          success: true,
          detail: {
            username: user.username
          }
        })
      } catch(e) {
        logger.error("Failed to auth account", e)
      }
    })
  }

  getUser(username) {
    //TODO, read from real userdb
    return this.userdb[username]
  }

  /**
   * Add a user to the user database
   */
  addUser(principal) {
    var _this = this
    return new RSVP.Promise((resolve, reject) => {
      if (principal.username) {

        var hash = principal.passwordHash
        if (typeof hash !== 'string') {
          hash = hash.toString("utf8")
        }

        _this.userdb[principal.username] = {
          username: principal.username,
          passwordHash: hash
        }
      }
      resolve({
        success: true
      })
    })
  }
}
