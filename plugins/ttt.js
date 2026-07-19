const { Module } = require("../main");

// Active games store
const activeGames = new Map(); // JID -> game object

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

function checkWinner(board) {
  for (const comb of winningCombinations) {
    const [a, b, c] = comb;
    if (board[a] && board[a] !== ' ' && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (!board.includes(' ')) {
    return 'tie';
  }
  return null;
}

function renderBoard(board) {
  const emotes = {
    'X': '❌',
    'O': '⭕',
    ' ': '⬜'
  };
  
  const cells = board.map((cell, idx) => {
    if (cell === ' ') {
      // Show position number
      const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
      return numbers[idx];
    }
    return emotes[cell];
  });

  return `${cells[0]} | ${cells[1]} | ${cells[2]}
-----------
${cells[3]} | ${cells[4]} | ${cells[5]}
-----------
${cells[6]} | ${cells[7]} | ${cells[8]}`;
}

Module(
  {
    pattern: "ttt ?(.*)",
    desc: "Play Tic Tac Toe game. Challenge: .ttt @tag | Accept: .ttt accept | Move: .ttt <1-9> | Quit: .ttt quit",
    use: "game",
    fromMe: false
  },
  async (message, match) => {
    const chatJid = message.jid;
    const sender = message.sender;
    const input = match[1]?.trim().toLowerCase();
    
    // Check if there is an active game in this chat
    let game = activeGames.get(chatJid);

    // 1. Quit Game
    if (input === 'quit' || input === 'stop') {
      if (!game) {
        return await message.sendReply("‧₊˚ ☁️ No active game in this chat! ࣪ ִֶָ☾.");
      }
      if (sender !== game.player1 && sender !== game.player2) {
        return await message.sendReply("‧₊˚ ☁️ Only players in the active game can quit! ࣪ ִֶָ☾.");
      }
      
      activeGames.delete(chatJid);
      return await message.client.sendMessage(chatJid, {
        text: `— ᨳଓ *Tic-Tac-Toe Game Stopped* by @${sender.split('@')[0]} >⩊<.ᐟ`,
        mentions: [sender]
      });
    }

    // 2. Accept challenge
    if (input === 'accept' || input === 'ok') {
      if (!game) {
        return await message.sendReply("‧₊˚ ☁️ No pending challenges in this chat! ࣪ ִֶָ☾.");
      }
      if (game.status !== 'waiting') {
        return await message.sendReply("‧₊˚ ☁️ A game is already in progress! ࣪ ִֶָ☾.");
      }
      if (sender !== game.player2) {
        return await message.sendReply("‧₊˚ ☁️ Only the challenged opponent can accept this! ࣪ ִֶָ☾.");
      }

      game.status = 'playing';
      game.turn = Math.random() > 0.5 ? game.player1 : game.player2;

      const mentions = [game.player1, game.player2, game.turn];
      const startText = `‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ☾.
*Tic-Tac-Toe Game Started!* 🦢˚. ᵎᵎ
⋆‧°𓏲ּ𝄢 ——————————

${renderBoard(game.board)}

❌ Player 1: @${game.player1.split('@')[0]}
⭕ Player 2: @${game.player2.split('@')[0]}

ᯓ★ First Turn goes to: @${game.turn.split('@')[0]}!
Place your move using \`.ttt <1-9>\``;

      return await message.client.sendMessage(chatJid, { text: startText, mentions });
    }

    // 3. Make a move (input 1-9)
    if (/^[1-9]$/.test(input)) {
      if (!game || game.status !== 'playing') {
        return await message.sendReply("‧₊˚ ☁️ No game in progress! Challenge someone with .ttt @tag ࣪ ִֶָ☾.");
      }
      if (sender !== game.turn) {
        return await message.sendReply("‧₊˚ ☁️ Wait for your turn! ࣪ ִֶָ☾.");
      }

      const moveIdx = parseInt(input) - 1;
      if (game.board[moveIdx] !== ' ') {
        return await message.sendReply("‧₊˚ ☁️ That spot is already taken! ࣪ ִֶָ☾.");
      }

      // Make the move
      const mark = (sender === game.player1) ? 'X' : 'O';
      game.board[moveIdx] = mark;

      // Check win/tie
      const winnerMark = checkWinner(game.board);
      if (winnerMark) {
        const boardRendered = renderBoard(game.board);
        activeGames.delete(chatJid);

        if (winnerMark === 'tie') {
          return await message.client.sendMessage(chatJid, {
            text: `‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ☾.
*Tic-Tac-Toe Tie!* 🤝

${boardRendered}

>⩊<.ᐟ Well played, it is a draw!`,
            mentions: [game.player1, game.player2]
          });
        } else {
          const winnerJid = (winnerMark === 'X') ? game.player1 : game.player2;
          return await message.client.sendMessage(chatJid, {
            text: `‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ☾.
*Tic-Tac-Toe Winner!* 🏆
.𖥔 ݁ ˖🦢˚. ᵎᵎ

${boardRendered}

🎉 Congratulations @${winnerJid.split('@')[0]}! You won!
💀 Better luck next time @${(winnerJid === game.player1 ? game.player2 : game.player1).split('@')[0]}!`,
            mentions: [game.player1, game.player2]
          });
        }
      }

      // Switch turn
      game.turn = (game.turn === game.player1) ? game.player2 : game.player1;
      
      const turnText = `‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ☾.
*Tic-Tac-Toe* 🪐
⋆‧°𓏲ּ𝄢 ——————————

${renderBoard(game.board)}

ᯓ★ Turn: @${game.turn.split('@')[0]}
Make your move using \`.ttt <1-9>\``;

      return await message.client.sendMessage(chatJid, {
        text: turnText,
        mentions: [game.player1, game.player2, game.turn]
      });
    }

    // 4. Challenge a player (via tag)
    const mentionJids = message.mention || [];
    // If no mentions in message metadata, check if there is an inline tag or phone number in input
    if (mentionJids.length === 0) {
      // Check if input is a tag like @919999999999
      const matchTag = input?.match(/@?([0-9]+)/);
      if (matchTag) {
        mentionJids.push(`${matchTag[1]}@s.whatsapp.net`);
      }
    }

    if (mentionJids.length > 0) {
      if (game) {
        return await message.sendReply("‧₊˚ ☁️ A game is already in progress or pending! End it first using \`.ttt quit\` ࣪ ִֶָ☾.");
      }

      const opponent = mentionJids[0];
      if (opponent === sender) {
        return await message.sendReply("‧₊˚ ☁️ You cannot play against yourself! ࣪ ִֶָ☾.");
      }

      const newGame = {
        player1: sender,
        player2: opponent,
        board: [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
        turn: null,
        status: 'waiting'
      };

      activeGames.set(chatJid, newGame);

      const challengeText = `‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ☾.
*Tic-Tac-Toe Challenge!* 🪐
.𖥔 ݁ ˖🦢˚. ᵎᵎ

@${sender.split('@')[0]} has challenged @${opponent.split('@')[0]} to a match!

👉 Type \`.ttt accept\` to play, or \`.ttt quit\` to reject.`;

      return await message.client.sendMessage(chatJid, {
        text: challengeText,
        mentions: [sender, opponent]
      });
    }

    // 5. Default help message
    const helpMsg = `‧₊˚ ☁️ *Tic-Tac-Toe Game Commands* ࣪ ִֶָ☾.
.𖥔 ݁ ˖🦢˚. ᵎᵎ

• \`.ttt @tag\` - Challenge someone
• \`.ttt accept\` - Accept a challenge
• \`.ttt <1-9>\` - Make a move
• \`.ttt quit\` - Forfeit / Stop game

*Board positions:*
1️⃣ | 2️⃣ | 3️⃣
-----------
4️⃣ | 5️⃣ | 6️⃣
-----------
7️⃣ | 8️⃣ | 9️⃣`;
    
    return await message.sendReply(helpMsg);
  }
);
