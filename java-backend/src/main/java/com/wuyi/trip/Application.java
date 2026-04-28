package com.wuyi.trip;

import static spark.Spark.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;

public class Application {
    
    private static final Gson gson = new Gson();
    private static final String DATA_DIR = "../data";
    private static final String MESSAGES_FILE = DATA_DIR + "/messages.json";
    private static final String VISITS_FILE = DATA_DIR + "/visits.json";
    private static final String LIKES_FILE = DATA_DIR + "/likes.json";
    private static final String LIKED_IPS_FILE = DATA_DIR + "/liked_ips.json";
    
    private static List<Message> messages = new CopyOnWriteArrayList<>();
    private static List<Visit> visits = new CopyOnWriteArrayList<>();
    private static Map<String, Integer> likes = new ConcurrentHashMap<>();
    private static Map<String, Boolean> likedIPs = new ConcurrentHashMap<>();
    
    public static void main(String[] args) {
        // 加载数据
        loadData();
        
        // 配置端口
        port(3000);
        
        // CORS
        options("/*", (req, res) -> {
            String accessControlRequestHeaders = req.headers("Access-Control-Request-Headers");
            if (accessControlRequestHeaders != null) {
                res.header("Access-Control-Allow-Headers", accessControlRequestHeaders);
            }
            String accessControlRequestMethod = req.headers("Access-Control-Request-Method");
            if (accessControlRequestMethod != null) {
                res.header("Access-Control-Allow-Methods", accessControlRequestMethod);
            }
            return "OK";
        });
        
        before((req, res) -> {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Content-Type");
            res.type("application/json");
        });
        
        // 健康检查
        get("/api/health", (req, res) -> {
            JsonObject json = new JsonObject();
            json.addProperty("success", true);
            json.addProperty("status", "running");
            JsonObject data = new JsonObject();
            data.addProperty("messages", messages.size());
            data.addProperty("visits", visits.size());
            json.add("data", data);
            return json;
        });
        
        // 获取留言列表
        get("/api/messages", (req, res) -> {
            JsonObject json = new JsonObject();
            json.addProperty("success", true);
            json.add("data", gson.toJsonTree(messages));
            return json;
        });
        
        // 发送留言
        post("/api/messages", (req, res) -> {
            JsonObject body = gson.fromJson(req.body(), JsonObject.class);
            String content = body.has("content") ? body.get("content").getAsString() : "";
            String nickname = body.has("nickname") ? body.get("nickname").getAsString() : "匿名游客";
            
            if (content == null || content.trim().isEmpty()) {
                res.status(400);
                JsonObject error = new JsonObject();
                error.addProperty("success", false);
                error.addProperty("error", "留言内容不能为空");
                return error;
            }
            
            if (content.length() > 200) {
                res.status(400);
                JsonObject error = new JsonObject();
                error.addProperty("success", false);
                error.addProperty("error", "留言内容不能超过200字");
                return error;
            }
            
            Message message = new Message(
                System.currentTimeMillis(),
                content.trim(),
                nickname,
                req.ip(),
                req.headers("User-Agent"),
                new Date().toInstant().toString()
            );
            
            messages.add(0, message);
            if (messages.size() > 1000) {
                messages = new CopyOnWriteArrayList<>(messages.subList(0, 1000));
            }
            
            saveMessages();
            
            JsonObject json = new JsonObject();
            json.addProperty("success", true);
            json.add("data", gson.toJsonTree(message));
            return json;
        });
        
        // 删除留言
        delete("/api/messages/:id", (req, res) -> {
            long id = Long.parseLong(req.params(":id"));
            String clientIP = req.ip();
            String adminKey = req.queryParams("admin");
            
            Message message = messages.stream()
                .filter(m -> m.id == id)
                .findFirst()
                .orElse(null);
            
            if (message == null) {
                res.status(404);
                JsonObject error = new JsonObject();
                error.addProperty("success", false);
                error.addProperty("error", "留言不存在");
                return error;
            }
            
            boolean isOwner = message.ip != null && message.ip.equals(clientIP);
            boolean isAdmin = "wuyi2024".equals(adminKey);
            
            if (!isOwner && !isAdmin) {
                res.status(403);
                JsonObject error = new JsonObject();
                error.addProperty("success", false);
                error.addProperty("error", "无权删除");
                return error;
            }
            
            messages.removeIf(m -> m.id == id);
            saveMessages();
            
            likes.remove(String.valueOf(id));
            saveLikes();
            
            JsonObject json = new JsonObject();
            json.addProperty("success", true);
            return json;
        });
        
        // 点赞
        post("/api/messages/:id/like", (req, res) -> {
            long id = Long.parseLong(req.params(":id"));
            String clientIP = req.ip();
            String ipKey = clientIP + "_" + id;
            
            String key = String.valueOf(id);
            int currentLikes = likes.getOrDefault(key, 0);
            boolean liked = likedIPs.getOrDefault(ipKey, false);
            
            if (liked) {
                // 取消点赞
                likes.put(key, Math.max(0, currentLikes - 1));
                likedIPs.put(ipKey, false);
            } else {
                // 点赞
                likes.put(key, currentLikes + 1);
                likedIPs.put(ipKey, true);
            }
            
            saveLikes();
            saveLikedIPs();
            
            JsonObject data = new JsonObject();
            data.addProperty("likes", likes.getOrDefault(key, 0));
            data.addProperty("liked", !liked);
            
            JsonObject json = new JsonObject();
            json.addProperty("success", true);
            json.add("data", data);
            return json;
        });
        
        // 记录访问
        post("/api/visit", (req, res) -> {
            Visit visit = new Visit(
                System.currentTimeMillis(),
                req.ip(),
                req.headers("User-Agent"),
                req.headers("Referer"),
                req.queryParams("url"),
                new Date().toInstant().toString()
            );
            
            visits.add(0, visit);
            if (visits.size() > 5000) {
                visits = new CopyOnWriteArrayList<>(visits.subList(0, 5000));
            }
            
            saveVisits();
            
            JsonObject json = new JsonObject();
            json.addProperty("success", true);
            return json;
        });
        
        // 获取统计
        get("/api/stats", (req, res) -> {
            String today = new Date().toInstant().toString().substring(0, 10);
            long todayVisits = visits.stream()
                .filter(v -> v.timestamp != null && v.timestamp.startsWith(today))
                .count();
            
            long uniqueIPs = visits.stream()
                .map(v -> v.ip)
                .distinct()
                .count();
            
            // 最近5分钟在线
            long fiveMinutesAgo = System.currentTimeMillis() - 5 * 60 * 1000;
            long onlineNow = visits.stream()
                .filter(v -> {
                    try {
                        return java.time.Instant.parse(v.timestamp).toEpochMilli() > fiveMinutesAgo;
                    } catch (Exception e) {
                        return false;
                    }
                })
                .map(v -> v.ip)
                .distinct()
                .count();
            
            JsonObject data = new JsonObject();
            data.addProperty("totalVisits", visits.size());
            data.addProperty("todayVisits", todayVisits);
            data.addProperty("uniqueVisitors", uniqueIPs);
            data.addProperty("onlineNow", onlineNow);
            data.addProperty("totalMessages", messages.size());
            data.addProperty("lastUpdate", new Date().toInstant().toString());
            
            JsonObject json = new JsonObject();
            json.addProperty("success", true);
            json.add("data", data);
            return json;
        });
        
        // 获取访问历史
        get("/api/visits", (req, res) -> {
            JsonObject json = new JsonObject();
            json.addProperty("success", true);
            json.add("data", gson.toJsonTree(visits.subList(0, Math.min(20, visits.size()))));
            return json;
        });
        
        System.out.println("================================");
        System.out.println(" 后端服务已启动！");
        System.out.println(" 地址: http://localhost:3000");
        System.out.println(" API:");
        System.out.println("   GET    /api/messages       - 获取留言");
        System.out.println("   POST   /api/messages       - 发送留言");
        System.out.println("   DELETE /api/messages/:id   - 删除留言");
        System.out.println("   POST   /api/messages/:id/like - 点赞");
        System.out.println("   POST   /api/visit          - 记录访问");
        System.out.println("   GET    /api/stats          - 访问统计");
        System.out.println("   GET    /api/visits         - 访问历史");
        System.out.println("   GET    /api/health         - 健康检查");
        System.out.println("================================");
    }
    
    // 数据加载
    private static void loadData() {
        try {
            File dataDir = new File(DATA_DIR);
            if (!dataDir.exists()) {
                dataDir.mkdirs();
            }
            
            messages = loadList(MESSAGES_FILE, Message.class);
            visits = loadList(VISITS_FILE, Visit.class);
            likes = loadMap(LIKES_FILE, Integer.class);
            likedIPs = loadMap(LIKED_IPS_FILE, Boolean.class);
            
            System.out.println("加载数据: " + messages.size() + " 条留言, " + visits.size() + " 次访问");
        } catch (Exception e) {
            System.err.println("加载数据失败: " + e.getMessage());
        }
    }
    
    @SuppressWarnings("unchecked")
    private static <T> List<T> loadList(String file, Class<T> clazz) {
        try {
            String content = new String(Files.readAllBytes(Paths.get(file)));
            T[] array = (T[]) gson.fromJson(content, java.lang.reflect.Array.newInstance(clazz, 0).getClass());
            return new CopyOnWriteArrayList<>(Arrays.asList(array));
        } catch (Exception e) {
            return new CopyOnWriteArrayList<>();
        }
    }
    
    @SuppressWarnings("unchecked")
    private static <T> Map<String, T> loadMap(String file, Class<T> clazz) {
        try {
            String content = new String(Files.readAllBytes(Paths.get(file)));
            return new ConcurrentHashMap<>(gson.fromJson(content, Map.class));
        } catch (Exception e) {
            return new ConcurrentHashMap<>();
        }
    }
    
    // 数据保存
    private static void saveMessages() {
        saveFile(MESSAGES_FILE, messages);
    }
    
    private static void saveVisits() {
        saveFile(VISITS_FILE, visits);
    }
    
    private static void saveLikes() {
        saveFile(LIKES_FILE, likes);
    }
    
    private static void saveLikedIPs() {
        saveFile(LIKED_IPS_FILE, likedIPs);
    }
    
    private static void saveFile(String file, Object data) {
        try {
            Files.write(Paths.get(file), gson.toJson(data).getBytes());
        } catch (IOException e) {
            System.err.println("保存失败 " + file + ": " + e.getMessage());
        }
    }
}
