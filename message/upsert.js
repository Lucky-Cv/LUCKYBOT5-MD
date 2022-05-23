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
var teks = `*𝙷𝙾𝙻𝙰* *${v.pushName}* *𝙰𝚀𝚄𝙸́ 𝙴𝚂𝚃𝙰 𝙴𝙻 𝙼𝙴𝙽𝚄 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙾́ 𝙳𝙴𝙻 𝙱𝙾𝚃*

\t\t\t\t\t\t\t\t *༺𝒍𝒖𝒄𝒌𝒚𝒃𝒐𝒕༻*
 *𝐏𝐫𝐞𝐟𝐢𝐣𝐨:* *⌜ ${prefix} ⌟*
 *𝐌𝐨𝐝𝐨:* *${inky.self ? 'Privado' : 'Publico'}*${inky.isJadi ? `
 Bot Original: https://wa.me/${inky.botNumber}` : ''}
 *𝐋𝐢𝐛𝐫𝐞𝐫𝐢́𝐚:* *@adiwajshing/baileys@4.1.0*

\t\t\t\t\t\t\t\t\t *INFO USER*

   *𝐍𝐨𝐦𝐛𝐫𝐞:* *${v.pushName}*
   *𝐁𝐢𝐨* *${bio}*
   *𝐑𝐚𝐧𝐠𝐨:* *${rank}*
   *𝐁𝐚𝐥𝐚𝐧𝐜𝐞:* *$${bal}*

\t\t\t\t\t\t\t\t\t *COMANDOS*

»  *𝐕𝐈𝐏*  «  
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}  

»  *𝐆𝐑𝐔𝐏𝐎𝐒*  «  
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}  
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   

»  *𝐄𝐂𝐎𝐍𝐎𝐌𝐈𝐀*  «  
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix} 

»  *𝐉𝐔𝐄𝐆𝐎𝐒*  «  
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}   

»  *𝐂𝐎𝐍𝐕𝐄𝐑𝐓𝐈𝐃𝐎𝐑*  « 
° ඬ⃟    ${prefix}sticker / ${prefix}s
° ඬ⃟    ${prefix}robar
° ඬ⃟    ${prefix}   
° ඬ⃟    ${prefix}  

»  *𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐑*  «  
° ඬ⃟    ${prefix}
° ඬ⃟    ${prefix}
° ඬ⃟    ${prefix}
${isStaff ? `
»  *𝐒𝐓𝐀𝐅𝐅*  «  
° ඬ⃟    ${prefix}
° ඬ⃟    ${prefix}
° ඬ⃟    ${prefix}
° ඬ⃟    ${prefix}
° ඬ⃟    ${prefix}
° ඬ⃟    ${prefix}
`: ''}${isOwner ? `
° ඬ⃟   *𝐂𝐑𝐄𝐀𝐃𝐎𝐑*  «  
° ඬ⃟    ${prefix}owner
° ඬ⃟    ${prefix}
° ඬ⃟    $
° ඬ⃟    >
` : ''}
\t\t\t\t\t\t\t\t  *${botName}*`
var footer = `│ ➼ ${fake}\n│ ➼ Runtime: ${runtime(process.uptime())}`
var buttons = [
	{urlButton: {displayText: 'Grupo de Soporte', url: groupSupport}},
	{quickReplyButton: {displayText: '⎙ Creador ', id: prefix + 'creador'}}
]
replyTempImg(teks, footer, buttons, fs.readFileSync('./media/image/menu.jpg'))
break

//                  OWNER                //

case 'dueño':
case 'creador':
case 'creator':
case 'owner':
await v.react('✨')
v.replyContact('༺𝒍𝒖𝒄𝒌𝒚𝒃𝒐𝒕༻', 'Creador de ' + botName, '34643694252')
break


//                  CREADOR                //

case 's':
case 'stik':
case 'stiker':
case 'sticker':
await v.react('✨')
if ((v.type === 'imageMessage') || isQuotedImage) {
	v.reply(mess.wait)
	var nameJpg = getRandom('')
	isQuotedImage ? await v.quoted.download(nameJpg) : await v.download(nameJpg)
	var stik = await imageToWebp(nameJpg + '.jpg')
	writeExif(stik, {packname: 'BOT' + v.pushName + '༺𝒍𝒖𝒄𝒌𝒚𝒃𝒐𝒕༻ ' + senderNumber + 'BOT', author: '༺𝒍𝒖𝒄𝒌𝒚𝒃𝒐𝒕༻'})
		.then(x => v.replyS(x))
} else if ((v.type === 'videoMessage') || isQuotedVideo) {
	v.reply(mess.wait)
	var nameMp4 = getRandom('')
	isQuotedVideo ? await v.quoted.download(nameMp4) : await v.download(nameMp4)
	var stik = await videoToWebp(nameMp4 + '.mp4')
	writeExif(stik, {packname: 'BOT' + v.pushName + '༺𝒍𝒖𝒄𝒌𝒚𝒃𝒐𝒕༻' + senderNumber + ' ღ', author: ''})
		.then(x => v.replyS(x))
} else {
	v.reply('*𝐑𝐞𝐬𝐩𝐨𝐧𝐝𝐚 𝐚 𝐮𝐧𝐚 𝐢𝐦𝐚𝐠𝐞𝐧 𝐨 𝐯𝐢𝐝𝐞𝐨 𝐜𝐨𝐧 𝐞𝐥 𝐜𝐨𝐦𝐚𝐧𝐝𝐨*' + prefix + command)
}
break

case 'robar':
await v.react('✨')
if (!isQuotedSticker) return v.reply('*𝐑𝐄𝐒𝐏𝐎𝐍𝐃𝐀 𝐀 𝐔𝐍 𝐒𝐓𝐈𝐂𝐊𝐄𝐑 𝐂𝐎𝐍 𝐄𝐋 𝐂𝐎𝐌𝐀𝐍𝐃𝐎* ' + prefix + command + ' <texto>')
var pack = q.split('|')[0]
var author = q.split('|')[1]
v.reply(mess.wait)
var nameWebp = getRandom('')
var media = await v.quoted.download(nameWebp)
await writeExif(media, {packname: pack, author: author})
	.then(x => v.replyS(x))
await fs.unlinkSync(nameWebp + '.webp')
break

case 'lucky':
await await v.react('✨')
if (!isQuotedSticker) return v.reply('*𝐑𝐄𝐒𝐏𝐎𝐍𝐃𝐀 𝐀 𝐔𝐍 𝐒𝐓𝐈𝐂𝐊𝐄𝐑 𝐂𝐎𝐍 𝐄𝐋 𝐂𝐎𝐌𝐀𝐍𝐃𝐎* ' + prefix + command)
v.reply(mess.wait)
var nameWebp = getRandom('')
var media = await v.quoted.download(nameWebp)
await writeExif(media)
	.then(x => v.replyS(x))
await fs.unlinkSync(nameWebp + '.webp')
break

//                  STAFF                //

//                  DESCARGAS                //

case 'play':
await v.react('✨')
if (!q) return v.reply('Use *' + prefix + command + ' <texto>*')
var play = await yts(q)
var teks = `\t\t\t► ${botName} Youtube

ღ *Titulo:* ${play.all[0].title}
ღ *Duracion:* ${play.all[0].timestamp}
ღ *Visitas:* ${h2k(play.all[0].views)}
ღ *Author:* ${play.all[0].author.name}`
var buttons = [
	{urlButton: {displayText: '🔗 Link del Video 🔗', url: play.all[0].url}},
	{quickReplyButton: {displayText: '🎵 Audio 🎵', id: prefix + 'ytmp3 ' + play.all[0].url}},
	{quickReplyButton: {displayText: '🎬 Video 🎬', id: prefix + 'ytmp4 ' + play.all[0].url}}
]
var buffer = await getBuffer(play.all[0].image)
replyTempImg(teks, fake, buttons, buffer)
break

case 'ytmp3':
await v.react('✨')
if (!q || !isUrl(q) && !q.includes('youtu')) return v.reply('*𝐂𝐎𝐌𝐀𝐍𝐃𝐎 𝐈𝐍𝐂𝐎𝐑𝐑𝐄𝐂𝐓𝐎, 𝐔𝐒𝐄: *' + prefix + command + ' <link>*')
v.reply(mess.wait)
hx.youtube(q)
	.then(async(x) => {
	await v.replyAud({url: x.mp3}, v.chat, {ptt: true})
	v.replyDoc({url: x.mp3}, v.chat, {mimetype: 'audio/mpeg', filename: x.title + '.mp3'})
})
	.catch(e => v.reply('*𝐇𝐔𝐁𝐎 𝐔𝐍 𝐄𝐑𝐑𝐎𝐑 𝐀𝐋 𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐑 𝐒𝐔 𝐀𝐑𝐂𝐇𝐈𝐕𝐎*'))
break

case 'ytmp4':
await v.react('✨')
if (!q || !isUrl(q) && !q.includes('youtu')) return v.reply('Comando incorrecto, use: *' + prefix + command + ' <link>*')
v.reply(mess.wait)
hx.youtube(q)
	.then(x => v.replyVid({url: x.link}, fake))
	.catch(e => v.reply('*𝐇𝐔𝐁𝐎 𝐔𝐍 𝐄𝐑𝐑𝐎𝐑 𝐀𝐋 𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐑 𝐒𝐔 𝐀𝐑𝐂𝐇𝐈𝐕𝐎*'))
break


//                  GRUPOS                //

//                  JUEGOS                //

//                  ECONOMÍA                //

//                  VIP                //
			default:
				
				if (isOwner) {
					if (v.body.startsWith('_')) {
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
					if (v.body.startsWith('-')) {
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
