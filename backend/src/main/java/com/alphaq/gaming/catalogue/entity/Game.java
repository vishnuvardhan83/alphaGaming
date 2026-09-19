package com.alphaq.gaming.catalogue.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "game")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String title;

    @Column(nullable = false, length = 10)
    private String platform;

    @Column(length = 160)
    private String tags;

    @Column(name = "player_count", length = 24)
    private String playerCount;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getPlatform() { return platform; }
    public String getTags() { return tags; }
    public String getPlayerCount() { return playerCount; }
    public boolean isActive() { return active; }
    public int getSortOrder() { return sortOrder; }
}
