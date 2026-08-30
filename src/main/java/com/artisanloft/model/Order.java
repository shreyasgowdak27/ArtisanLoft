package com.artisanloft.model;

import java.util.Date;

public class Order {
    private Long id;
    private String customerName;
    private String customerEmail;
    private double totalAmount;
    private Date orderDate;

    // This is the constructor that was causing the error
    public Order(Long id, String customerName, String customerEmail, double totalAmount, Date orderDate) {
        this.id = id;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.totalAmount = totalAmount;
        this.orderDate = orderDate;
    }

    // Getters needed by the Repository to read the data
    public String getCustomerName() { return customerName; }
    public String getCustomerEmail() { return customerEmail; }
    public double getTotalAmount() { return totalAmount; }
    public Date getOrderDate() { return orderDate; }
    public Long getId() { return id; }
}
    