package com.alphaq.gaming.catalogue.repo;

import com.alphaq.gaming.catalogue.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findByActiveTrueOrderBySortOrderAsc();
}
