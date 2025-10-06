document.addEventListener('DOMContentLoaded', function() {
    const mainDiv = document.querySelector('.maindiv');

    fetch('bookmarks.json')
        .then(response => response.json())
        .then(data => {
            // Clear the existing example content
            mainDiv.innerHTML = '';

            // Iterate over each category in the JSON data
            data.categories.forEach(category => {
                // Create the main category div
                const categoryDiv = document.createElement('div');
                categoryDiv.classList.add('category');

                // Create the category head div
                const categoryHeadDiv = document.createElement('div');
                categoryHeadDiv.classList.add('categoryHead');

                // Create the category icon
                const categoryIcon = document.createElement('img');
                categoryIcon.src = category.icon;
                categoryHeadDiv.appendChild(categoryIcon);

                // Create the category name
                const categoryName = document.createElement('h3');
                categoryName.textContent = category.name;
                categoryHeadDiv.appendChild(categoryName);

                categoryDiv.appendChild(categoryHeadDiv);

                // Create the category stars container
                const categoryStarsDiv = document.createElement('div');
                categoryStarsDiv.classList.add('categoryStars');

                // Iterate over each star in the category
                category.stars.forEach(star => {
                    // Create the star link element
                    const starLink = document.createElement('a');
                    starLink.classList.add('star');
                    starLink.href = star.link;

                    // Create the favicon image element
                    const favicon = document.createElement('img');
                    favicon.src = `https://www.google.com/s2/favicons?domain=${star.link}`;
                    favicon.alt = ''; // Alt text can be empty for decorative icons
                    favicon.style.marginRight = '8px'; // Add some space between the icon and the text

                    // Append the favicon and then the text to the link
                    starLink.appendChild(favicon);
                    starLink.appendChild(document.createTextNode(star.name));
                    
                    categoryStarsDiv.appendChild(starLink);
                });

                categoryDiv.appendChild(categoryStarsDiv);

                // Append the fully constructed category to the main container
                mainDiv.appendChild(categoryDiv);
            });
        })
        .catch(error => console.error('Error loading bookmarks:', error));
});