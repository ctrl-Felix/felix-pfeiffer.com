import messages from "@/data/messageCount.json";

export const messageTotal = () => Object.keys(messages.userMessages).length;
