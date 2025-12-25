from aiogram import Bot, Dispatcher, types
from aiogram.utils import executor
import logging

logging.basicConfig(level=logging.INFO)

BOT_TOKEN = "8286295941:AAEAK61r6fJs7wSpUEnyLIxA67U6R_Yimho"

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)

@dp.message_handler(commands=["start"])
async def start_handler(message: types.Message):
    kb = types.InlineKeyboardMarkup()
    kb.add(
        types.InlineKeyboardButton(
            text="Open",
            web_app=types.WebAppInfo(
                url="https://asiagold.pages.dev"
            )
        )
    )
    await message.answer(
        "برای ورود روی دکمه زیر کلیک کنید:",
        reply_markup=kb
    )

@dp.message_handler()
async def echo(message: types.Message):
    await message.answer("بات فعال است ✅")

if __name__ == "__main__":
    print("🤖 AsiaGold Bot is running...")
    executor.start_polling(dp, skip_updates=True)
