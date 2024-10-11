document.getElementById("sendBtn").addEventListener("click", async function () {
    let userInput = document.getElementById("userInput").value;
    if (userInput.trim() === "") return;

    // Display the user input
    let chatbox = document.getElementById("chatbox");
    let userMessage = document.createElement("div");
    userMessage.classList.add("message");
    userMessage.textContent = userInput;
    chatbox.appendChild(userMessage);

    // Clear the input field
    document.getElementById("userInput").value = "";

    // Call OpenAI API
    let response = await getChatbotResponse(userInput);

    // Display chatbot response
    let botMessage = document.createElement("div");
    botMessage.classList.add("message");
    botMessage.textContent = response;
    chatbox.appendChild(botMessage);

    chatbox.scrollTop = chatbox.scrollHeight; // Scroll to the bottom
});

// Function to get response from OpenAI API
async function getChatbotResponse(message) {
    const apiKey = "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"; // Replace with your OpenAI API key
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`, // Correct string interpolation
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo", // Specify the GPT model
            messages: [{ role: "user", content: message }]
        })
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
}
