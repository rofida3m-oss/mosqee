from openai import OpenAI

client = OpenAI(
    api_key="sk-7e191a35e0b34da48856aa2d08a534a4"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "hello, is my api key working?"}
    ]
)

print(response.choices[0].message.content)
