package com.artisanloft.repository;

import com.artisanloft.model.FurnitureItem;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class FurnitureRepository {

    private final JdbcTemplate jdbcTemplate;

    public FurnitureRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<FurnitureItem> furnitureMapper = (rs, rowNum) -> {
        FurnitureItem item = new FurnitureItem();
        item.setId(rs.getLong("id"));
        item.setName(rs.getString("name"));
        item.setDescription(rs.getString("description"));
        item.setPrice(rs.getDouble("price"));
        item.setCategory(rs.getString("category"));
        item.setImageUrl(rs.getString("image_url"));
        item.setImageUrls(rs.getString("image_urls"));
        return item;
    };

    public List<FurnitureItem> findAll() {
        return jdbcTemplate.query("SELECT * FROM furniture_items", furnitureMapper);
    }

    public List<FurnitureItem> searchByName(String query) {
        String sql = "SELECT * FROM furniture_items WHERE LOWER(name) LIKE LOWER(?)";
        return jdbcTemplate.query(sql, furnitureMapper, "%" + query + "%");
    }

    public FurnitureItem findById(Long id) {
        String sql = "SELECT * FROM furniture_items WHERE id = ?";
        try {
            // Using queryForObject with arguments as a simple vararg (id)
            return jdbcTemplate.queryForObject(sql, furnitureMapper, id);
        } catch (EmptyResultDataAccessException e) {
            return null; // Gracefully handles "ID not found"
        }
    }
}