package com.artisanloft.service;

import com.artisanloft.model.FurnitureItem;
import com.artisanloft.repository.FurnitureRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FurnitureService {

    private final FurnitureRepository repository;

    public FurnitureService(FurnitureRepository repository) {
        this.repository = repository;
    }

    public List<FurnitureItem> getAllProducts() {
        return repository.findAll();
    }

    // This method name must match what the Controller calls
    public List<FurnitureItem> searchProducts(String query) {
        return repository.searchByName(query);
    }

    public FurnitureItem getProductById(Long id) {
        return repository.findById(id);
    }
}