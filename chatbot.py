import anthropic

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from environment

conversation = []

print("Claude Chatbot — type 'quit' to exit\n")

while True:
    try:
        user_input = input("You: ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\nGoodbye!")
        break

    if not user_input:
        continue

    if user_input.lower() in ("quit", "exit"):
        print("Goodbye!")
        break

    conversation.append({"role": "user", "content": user_input})

    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        messages=conversation,
    )

    reply = response.content[0].text
    conversation.append({"role": "assistant", "content": reply})

    print(f"Claude: {reply}\n")
