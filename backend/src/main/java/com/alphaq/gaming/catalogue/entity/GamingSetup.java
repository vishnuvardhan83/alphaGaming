package com.alphaq.gaming.catalogue.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "gaming_setup")
public class GamingSetup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 16)
    private String code;

    @Column(nullable = false, length = 10)
    private String platform;

    @Column(nullable = false, length = 16)
    private String status = "AVAILABLE";  // AVAILABLE, MAINTENANCE

    @Column(name = "capacity_players", nullable = false)
    private int capacityPlayers = 1;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getPlatform() { return platform; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getCapacityPlayers() { return capacityPlayers; }
    public int getSortOrder() { return sortOrder; }
}
