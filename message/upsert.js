require('../config')

/*
	Libreria
*/

const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, makeInMemoryStore, getContentType } = require('@adiwajshing/baileys')
const P = require('pino')
const { exec } = require('child_process')
const fs = require('fs')
const hx = require('hxz-api')
const util = require('util')
const yts = require('yt-search')

/*
	Js
*/

const bj = []

const { imageToWebp, videoToWebp, writeExif } = require('../lib/exif')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep } = require('../lib/functions')
const { addFilter, addUser, addBal, checkBal, checkBalReg, isFiltered, removeBal } = require('../lib/money')
const { sms } = require('../lib/simple')

const { addSetBJ, drawRandomCard, getHandValue, position, isBJFrom, isBJPlayer, isSpamBJ } = require('../lib/game/blackjack')

/*
	Database
*/

// Usuario
const vip = JSON.parse(fs.readFileSync('./database/user/vip.json'))

// Grupo
const antiviewonce = JSON.parse(fs.readFileSync('./database/group/antiviewonce.json'))
const antilink = JSON.parse(fs.readFileSync('./database/group/antilink.json'))
const welcome = JSON.parse(fs.readFileSync('./database/group/welcome.json'))

module.exports = async(inky, v, store) => {
	try {
		v = sms(inky, v)
		if (v.isBaileys) return
		
		const isCmd = v.body.startsWith(prefix)
		const command = isCmd ? v.body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
		const commandStik = (v.type === 'stickerMessage') ? v.msg.fileSha256.toString('base64') : ''
		
		const args = v.body.trim().split(/ +/).slice(1)
		const q = args.join(' ')
		const senderNumber = v.sender.split('@')[0]
		const botNumber = inky.user.id.split(':')[0]
		const userBal = checkBalReg(senderNumber) ? checkBal(senderNumber) : '0'
		try { var bio = (await inky.fetchStatus(v.sender)).status } catch { var bio = 'Sin Bio' }
		const bal = h2k(userBal)
		
		const groupMetadata = v.isGroup ? await inky.groupMetadata(v.chat) : {}
		const groupMembers = v.isGroup ? groupMetadata.participants : []
		const groupAdmins = v.isGroup ? getGroupAdmins(groupMembers) : false
		
		const isMe = botNumber.includes(senderNumber)
		const isGroupAdmins = v.isGroup ? groupAdmins.includes(v.sender) : false
		const isBotAdmin = v.isGroup ? groupAdmins.includes(botNumber + '@s.whatsapp.net') : false
		const isOwner = owner.includes(senderNumber)
		const isStaff = staff.includes(senderNumber) || isOwner
		const isVip = vip.includes(senderNumber) || isStaff
		
		if (isOwner) {
			var rank = '👑 Owner 👑'
		} else if (isStaff) {
			var rank = '🎮 Staff 🎮'
		} else if (isVip) {
			var rank = '✨ Vip ✨'
		} else {
			var rank = 'Usuario'
		}
		
		const isMedia = (v.type === 'imageMessage' || v.type === 'videoMessage')
		const isQuotedMsg = v.quoted ? (v.quoted.type === 'conversation') : false
		const isQuotedViewOnce = v.quoted ? (v.quoted.type === 'viewOnceMessage') : false
		const isQuotedImage = v.quoted ? ((v.quoted.type === 'imageMessage') || (isQuotedViewOnce ? (v.quoted.msg.type === 'imageMessage') : false)) : false
		const isQuotedVideo = v.quoted ? ((v.quoted.type === 'videoMessage') || (isQuotedViewOnce ? (v.quoted.msg.type === 'videoMessage') : false)) : false
		const isQuotedSticker = v.quoted ? (v.quoted.type === 'stickerMessage') : false
		const isQuotedAudio = v.quoted ? (v.quoted.type === 'audioMessage') : false
		
		const buttonsResponseID = (v.type == 'buttonsResponseMessage') ? v.message.buttonsResponseMessage.selectedButtonId : ''
		
		const isAntiViewOnce = v.isGroup ? antiviewonce.includes(v.chat) : false
		const isAntiLink = v.isGroup ? antilink.includes(v.chat) : false
		const isWelcome = v.isGroup ? welcome.includes(v.chat) : false
		
		const replyTempImg = (teks, footer, buttons = [], img) => {
			inky.sendMessage(v.chat, { image: img, caption: teks, footer: footer, templateButtons: buttons })
		}
		
		if (inky.self) {
			if (!isStaff) return
		}
		if (isCmd) {
			if (!checkBalReg(senderNumber)) {
				addUser(senderNumber)
				addBal(senderNumber, 5000)
			}
		} else if (v.msg && checkBalReg(senderNumber) && !inky.isJadi && !isFiltered(senderNumber)) {
			addBal(senderNumber, 5)
			addFilter(senderNumber)
		}
		if (isAntiViewOnce && (v.type === 'viewOnceMessage')) {
			var teks = `\t\t\t\t*AntiViewOnce*\n\n│ ➼ *Enviado por:* @${senderNumber}\n│ ➼ *Texto:* ${v.msg.caption ? v.msg.caption : 'Sin Texto'}`
			var jids = [v.sender]
			v.mentionUser.map(x => jids.push(x))
			if (v.msg.type === 'imageMessage') {
				var nameJpg = getRandom('')
				v.replyImg(await v.download(nameJpg), teks, v.chat, {mentions: jids})
				await fs.unlinkSync(nameJpg  + '.jpg')
			} else if (v.msg.type === 'videoMessage') {
				var nameMp4 = getRandom('')
				v.replyVid(await v.download(nameMp4), teks, v.chat, {mentions: jids})
				await fs.unlinkSync(nameMp4 + '.mp4')
			}
		}
		if (isAntiLink && isBotAdmin && !isGroupAdmins && v.body.includes('chat.whatsapp.com/')) {
			if (v.body.split('chat.whatsapp.com/')[1].split(' ')[0] === (await inky.groupInviteCode(v.chat))) return
			inky.groupParticipantsUpdate(v.chat, [v.sender], 'remove')
				.then(x => v.reply('@' + senderNumber + ' ha sido eliminado por mandar link de otro grupo'))
				.catch(e => v.reply(e))
		}
		
		switch (commandStik) {

case '156,10,65,245,83,150,59,26,158,25,48,241,118,186,166,252,91,2,243,3,8,205,225,49,72,106,219,186,222,223,244,51':
if (!isStaff) return
if (!v.isGroup) return
if (!isBotAdmin) return
if (groupAdmins.includes(v.sender)) return
await inky.groupParticipantsUpdate(v.chat, [v.sender], 'promote')
	.then(async(x) => await v.react('✔'))
break

		}
		
		switch (command) {

case 'menu':
  case 'help':
await v.react('✨')
var teks = `*𝙷𝙾𝙻𝙰* 
que tal`
break

			default:
				
				if (isOwner) {
					if (v.body.startsWith('x')) {
						try {
							v.reply(Json(eval(q)))
						} catch(e) {
							v.reply(String(e))
						}
					}
					if (v.body.startsWith('>')) {
						try {
							v.reply(util.format(await eval(`(async () => {${v.body.slice(1)}})()`)))
						} catch(e) {
							v.reply(util.format(e))
						}
					}
					if (v.body.startsWith('$')) {
						exec(v.body.slice(1), (err, stdout) => {
							if (err) return v.reply(err)
							if (stdout) return v.reply(stdout)
						})
					}
				}
				
				if (v.body.toLowerCase().includes('teta')) {
					v.replyS(fs.readFileSync('./media/sticker/Tetas♡.webp'))
				}
				
				if (isCmd) {
					v.react('❌')
				}
				
				if (v.body.toLowerCase().startsWith('hit') || buttonsResponseID.includes('bHit')) {
					if (!(isBJFrom(bj, v.chat) ? isBJPlayer(bj, v.sender) : false)) return
					await v.react('✨')
					var bjPosition = bj[position(bj, v.chat, v.sender)]
					bjPosition.pHand.push(drawRandomCard())
					if (getHandValue(bjPosition.bHand) <= 10) {
						bjPosition.bHand.push(drawRandomCard())
					}
					if (getHandValue(bjPosition.pHand) > 21) {
						v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n➫ Mano del bot: *${getHandValue(bjPosition.bHand)}*\n\n🃏 *Has perdido $${h2k(bjPosition.balance)}* 🃏`)
						bj.splice(bj.indexOf(bjPosition), 1)
					} else {
						inky.sendMessage(v.chat, { text: `*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n\n🃏 Usa *Hit* o *Stand* 🃏`, footer: `Apuesta: *$${h2k(bjPosition.balance)}*\nBalance: *$${bal}*`, buttons: [{buttonId: 'bHit', buttonText: {displayText: 'Hit'}, type: 1}, {buttonId: 'bStand', buttonText: {displayText: 'Stand'}, type: 1}], headerType: 1, mentions: [v.sender] }, { quoted: v })
					}
				}
				if (v.body.toLowerCase().startsWith('stand') || buttonsResponseID.includes('bStand')) {
					if (!(isBJFrom(bj, v.chat) ? isBJPlayer(bj, v.sender) : false)) return
					await v.react('✨')
					var bjPosition = bj[position(bj, v.chat, v.sender)]
					bj.splice(bj.indexOf(bjPosition), 1)
					if (getHandValue(bjPosition.pHand) < getHandValue(bjPosition.bHand)) {
						v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n➫ Mano del bot: *${getHandValue(bjPosition.bHand)}*\n\n🃏 *Has perdido $${h2k(bjPosition.balance)}* 🃏`)
					} else if (getHandValue(bjPosition.pHand) === getHandValue(bjPosition.bHand)) {
						var result = Number(bjPosition.balance)
						addBal(senderNumber, result)
						v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n➫ Mano del bot: *${getHandValue(bjPosition.bHand)}*\n\n🃏 *Ha sido un empate* 🃏`)
					} else {
						var result = Number(bjPosition.balance)*2
						addBal(senderNumber, result)
						v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n➫ Mano del bot: *${getHandValue(bjPosition.bHand)}*\n\n🃏 *Felicidades has ganado $${h2k(result)}* 🃏`)
					}
				}
				
		}
		
	} catch (e) {
		const isError = String(e)
		
		inky.sendMessage(v.key.remoteJid, { text: isError }, { quoted: v })
		console.log(e)
	}
}
