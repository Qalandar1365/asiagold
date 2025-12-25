from aiogram import Bot, Dispatcher, types
from aiogram.utils import executor

# 🔴 توکن جدیدی که از BotFather می‌گیری را اینجا بگذار
BOT_TOKEN = "8286295941:AAEAK61r6fJs7wSpUEnyLIxA67U6R_Yimho"

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

@dp.message_handler(commands=["start"])
async def start(msg: types.Message):
    keyboard = types.InlineKeyboardMarkup()
    keyboard.add(
        types.InlineKeyboardButton(
            text="🔐 ورود به سامانه AsiaGold",
            web_app=types.WebAppInfo(
                url="https://asiagold.pages.dev"
            )
        )
    )
    await msg.answer(
        "برای ورود به سامانه AsiaGold روی دکمه زیر کلیک کنید:",
        reply_markup=keyboard
    )

if __name__ == "__main__":
    print("🤖 AsiaGold Bot is running...")
    executor.start_polling(dp)
