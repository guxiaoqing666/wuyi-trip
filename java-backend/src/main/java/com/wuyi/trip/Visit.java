package com.wuyi.trip;

public class Visit {
    public long id;
    public String ip;
    public String userAgent;
    public String referer;
    public String url;
    public String timestamp;
    
    public Visit() {}
    
    public Visit(long id, String ip, String userAgent, String referer, String url, String timestamp) {
        this.id = id;
        this.ip = ip;
        this.userAgent = userAgent;
        this.referer = referer;
        this.url = url;
        this.timestamp = timestamp;
    }
}
