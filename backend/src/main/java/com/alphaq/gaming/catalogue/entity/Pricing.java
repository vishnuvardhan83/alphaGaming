package com.alphaq.gaming.catalogue.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "pricing")
public class Pricing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String platform;

    @Column(name = "tier_code", nullable = false, length = 16)
    private String tierCode;

    @Column(nullable = false, length = 40)
    private String label;

    @Column(nullable = false)
    private int minutes;

    @Column(name = "price_inr", nullable = false)
    private int priceInr;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean active = true;

    public Long getId() { return id; }
    public String getPlatform() { return platform; }
    public String getTierCode() { return tierCode; }
    public String getLabel() { return label; }
    public int getMinutes() { return minutes; }
    public int getPriceInr() { return priceInr; }
    public int getSortOrder() { return sortOrder; }
    public boolean isActive() { return active; }
}
