package com.artisanloft.controller;

import com.artisanloft.model.FurnitureItem;
import com.artisanloft.service.FurnitureService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://artisan-loft-furniture-frontend.onrender.com") 
public class FurnitureController {

    private final FurnitureService service;

    public FurnitureController(FurnitureService service) {
        this.service = service;
    }

    @GetMapping
    public List<FurnitureItem> getAll(@RequestParam(required = false) String search) {
        // Now service.searchProducts(search) will resolve correctly
        if (search != null && !search.isEmpty()) {
            return service.searchProducts(search);
        }
        return service.getAllProducts();
    }

    @GetMapping("/{id}")
    public FurnitureItem getOne(@PathVariable Long id) {
        return service.getProductById(id);
    }
    @PostMapping("/orders")
    public String createOrder(@RequestBody Object orderData) {
        System.out.println("Received order: " + orderData);
        // This is a simple placeholder to make the frontend 'Success' alert show up
        return "Order Received Successfully";
    }
}
