package com.wuyi.trip;

public class Message {
    public long id;
    public String content;
    public String nickname;
    public String ip;
    public String userAgent;
    public String createdAt;
    public int likes;
    public boolean likedByMe;
    
    public Message() {}
    
    public Message(long id, String content, String nickname, String ip, String userAgent, String createdAt) {
        this.id = id;
        this.content = content;
        this.nickname = nickname;
        this.ip = ip;
        this.userAgent = userAgent;
        this.createdAt = createdAt;
        this.likes = 0;
        this.likedByMe = false;
    }
}
